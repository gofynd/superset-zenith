# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

"""Execute MCP SQL requests through Superset 4.1's SQL Lab command pipeline."""

from __future__ import annotations

import json
import uuid
from typing import Any, TYPE_CHECKING

from superset.mcp_service.sql_lab.schemas import (
    ColumnInfo,
    ExecuteSqlRequest,
    ExecuteSqlResponse,
    StatementData,
    StatementInfo,
)

if TYPE_CHECKING:
    from superset.sqllab.sqllab_execution_context import SqlJsonExecutionContext


def execute_sql_request(request: ExecuteSqlRequest) -> ExecuteSqlResponse:
    """Run a request using the same validation and execution path as SQL Lab."""
    from flask import current_app

    from superset.commands.sql_lab.execute import ExecuteSqlCommand
    from superset.daos.database import DatabaseDAO
    from superset.daos.query import QueryDAO
    from superset.jinja_context import get_template_processor
    from superset.sql_lab import get_sql_results
    from superset.sqllab.execution_context_convertor import ExecutionContextConvertor
    from superset.sqllab.query_render import SqlQueryRenderImpl
    from superset.sqllab.sql_json_executer import SynchronousSqlJsonExecutor
    from superset.sqllab.validators import CanAccessQueryValidatorImpl

    execution_context = _create_execution_context(request)
    if request.dry_run:
        return _render_sql(execution_context, request)

    query_dao = QueryDAO()
    result_converter = ExecutionContextConvertor()
    result_converter.set_max_row_in_display(int(current_app.config["DISPLAY_MAX_ROW"]))
    command = ExecuteSqlCommand(
        execution_context,
        query_dao,
        DatabaseDAO(),
        CanAccessQueryValidatorImpl(),
        SqlQueryRenderImpl(get_template_processor),
        SynchronousSqlJsonExecutor(
            query_dao,
            get_sql_results,
            request.timeout,
            False,
        ),
        result_converter,
        current_app.config["SQLLAB_CTAS_NO_LIMIT"],
    )
    result = command.run()
    return _convert_result(request.sql, json.loads(result["payload"]))


def _create_execution_context(request: ExecuteSqlRequest) -> SqlJsonExecutionContext:
    from superset.sqllab.sqllab_execution_context import SqlJsonExecutionContext
    from superset.utils import core as utils

    request_id = uuid.uuid4().hex
    context = SqlJsonExecutionContext(
        {
            "database_id": request.database_id,
            "catalog": request.catalog,
            "schema": request.schema_name,
            "sql": request.sql,
            "templateParams": json.dumps(request.template_params or {}),
            "runAsync": False,
            "queryLimit": request.limit or 0,
            "status": utils.QueryStatus.PENDING,
            "client_id": f"mcp-{request_id}",
            "sql_editor_id": f"mcp-{request_id}",
            "tab": "MCP",
            "expand_data": False,
        }
    )
    context.async_flag = False
    return context


def _render_sql(
    execution_context: SqlJsonExecutionContext,
    request: ExecuteSqlRequest,
) -> ExecuteSqlResponse:
    from superset.daos.database import DatabaseDAO
    from superset.jinja_context import get_template_processor
    from superset.sql.parse import SQLScript
    from superset.sqllab.query_render import SqlQueryRenderImpl
    from superset.sqllab.validators import CanAccessQueryValidatorImpl

    database = DatabaseDAO.find_by_id(request.database_id)
    if database is None:
        raise ValueError(f"Database with ID {request.database_id} not found")

    execution_context.set_database(database)
    query = execution_context.create_query()
    query.database = database
    execution_context.set_query(query)
    CanAccessQueryValidatorImpl().validate(query)
    rendered_sql = SqlQueryRenderImpl(get_template_processor).render(execution_context)

    if request.limit:
        script = SQLScript(rendered_sql, database.db_engine_spec.engine)
        if not script.has_mutation():
            rendered_sql = database.apply_limit_to_sql(
                rendered_sql,
                request.limit,
                force=True,
            )

    return ExecuteSqlResponse(
        success=True,
        statements=[
            StatementInfo(
                original_sql=request.sql,
                executed_sql=rendered_sql,
                row_count=0,
            )
        ],
    )


def _convert_result(original_sql: str, payload: dict[str, Any]) -> ExecuteSqlResponse:
    rows = payload.get("data") or []
    columns = [_convert_column(column) for column in payload.get("columns") or []]
    query = payload.get("query") or {}
    execution_time = _execution_time(query)
    statement_data = StatementData(rows=rows, columns=columns) if columns else None
    statement = StatementInfo(
        original_sql=original_sql,
        executed_sql=query.get("executedSql") or original_sql,
        row_count=query.get("rows") or len(rows),
        execution_time_ms=(execution_time * 1000 if execution_time is not None else None),
        data=statement_data,
    )
    return ExecuteSqlResponse(
        success=True,
        rows=rows,
        columns=columns,
        row_count=len(rows),
        execution_time=execution_time,
        statements=[statement],
    )


def _convert_column(column: dict[str, Any]) -> ColumnInfo:
    return ColumnInfo(
        name=column.get("name") or column.get("column_name") or "unknown",
        type=str(column.get("type") or "unknown"),
        is_nullable=column.get("is_nullable"),
    )


def _execution_time(query: dict[str, Any]) -> float | None:
    start = query.get("startDttm")
    end = query.get("endDttm")
    if start is None or end is None:
        return None
    return max(0.0, end - start) / 1000
