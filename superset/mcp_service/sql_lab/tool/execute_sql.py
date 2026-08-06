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

"""Execute SQL through Superset's MCP service."""

import logging

from fastmcp import Context

from superset.mcp_service.decorators import tool, ToolAnnotations
from superset.mcp_service.sql_lab.execution import execute_sql_request
from superset.mcp_service.sql_lab.schemas import ExecuteSqlRequest, ExecuteSqlResponse

logger = logging.getLogger(__name__)


@tool(
    tags=["mutate"],
    class_permission_name="SQLLab",
    method_permission_name="execute_sql_query",
    annotations=ToolAnnotations(
        title="Execute SQL query",
        readOnlyHint=False,
        destructiveHint=True,
    ),
)
async def execute_sql(request: ExecuteSqlRequest, ctx: Context) -> ExecuteSqlResponse:
    """Execute a SQL query through Superset's SQL Lab security pipeline."""
    await ctx.info(
        "Starting SQL execution: database_id=%s, timeout=%s, limit=%s, schema=%s"
        % (request.database_id, request.timeout, request.limit, request.schema_name)
    )
    logger.info("Executing SQL query on database ID: %s", request.database_id)
    try:
        response = execute_sql_request(request)
    except Exception as ex:
        await ctx.error(
            "SQL execution failed: error=%s, database_id=%s"
            % (str(ex), request.database_id)
        )
        raise

    await ctx.info(
        "SQL execution completed successfully: rows_returned=%s, execution_time=%s"
        % (response.row_count, response.execution_time)
    )
    return response
