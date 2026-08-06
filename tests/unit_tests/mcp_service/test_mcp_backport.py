# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with this
# work for additional information regarding copyright ownership.  The ASF
# licenses this file to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
# License for the specific language governing permissions and limitations
# under the License.

import asyncio
import json
from types import SimpleNamespace
from unittest.mock import patch

import mcp.types as mcp_types
from fastmcp.tools.tool import ToolResult
from sqlalchemy import Column, create_engine, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

from superset.daos.base import BaseDAO
from superset.mcp_service.common.filters import ColumnOperator
from superset.mcp_service.middleware import LoggingMiddleware
from superset.mcp_service.sql_lab.execution import _convert_result


def test_mcp_registers_the_complete_tool_surface() -> None:
    from superset.mcp_service.app import mcp

    tools = asyncio.run(mcp.list_tools())

    assert {tool.name for tool in tools} == {
        "add_chart_to_existing_dashboard",
        "create_virtual_dataset",
        "execute_sql",
        "generate_chart",
        "generate_dashboard",
        "generate_explore_link",
        "get_chart_data",
        "get_chart_info",
        "get_chart_preview",
        "get_chart_type_schema",
        "get_dashboard_info",
        "get_database_info",
        "get_dataset_info",
        "get_instance_info",
        "get_schema",
        "health_check",
        "list_charts",
        "list_dashboards",
        "list_databases",
        "list_datasets",
        "open_sql_lab_with_context",
        "save_sql_query",
        "update_chart",
        "update_chart_preview",
    }


def test_backported_dao_list_filters_and_paginates() -> None:
    Base = declarative_base()

    class Item(Base):
        __tablename__ = "mcp_backport_item"

        id = Column(Integer, primary_key=True)
        name = Column(String)
        score = Column(Integer)

    class ItemDAO(BaseDAO[Item]):
        pass

    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    session.add_all(
        [
            Item(name="Alpha", score=3),
            Item(name="Beta", score=1),
            Item(name="Alpine", score=2),
        ]
    )
    session.commit()

    with patch("superset.daos.base.db", SimpleNamespace(session=session)):
        rows, count = ItemDAO.list(
            column_operators=[
                ColumnOperator(col="name", opr="sw", value="Al"),
            ],
            order_column="score",
            order_direction="asc",
            columns=["id", "name", "score"],
        )

        assert count == 2
        assert [row.name for row in rows] == ["Alpine", "Alpha"]
        assert ItemDAO.count(
            [ColumnOperator(col="score", opr="gte", value=2)]
        ) == 2


def test_sql_lab_payload_is_converted_to_mcp_schema() -> None:
    response = _convert_result(
        "SELECT 1",
        {
            "data": [{"id": 1}],
            "columns": [{"name": "id", "type": "INT"}],
            "query": {
                "executedSql": "SELECT 1 AS id",
                "rows": 1,
                "startDttm": 1000.0,
                "endDttm": 1250.0,
            },
        },
    )

    assert response.success is True
    assert response.rows == [{"id": 1}]
    assert response.row_count == 1
    assert response.execution_time == 0.25
    assert response.statements is not None
    assert response.statements[0].executed_sql == "SELECT 1 AS id"
    assert response.statements[0].execution_time_ms == 250


def test_audit_logging_distinguishes_null_error_type_from_an_error() -> None:
    middleware = LoggingMiddleware()

    success = ToolResult(
        content=[
            mcp_types.TextContent(
                type="text",
                text=json.dumps(
                    {"success": True, "error": None, "error_type": None}
                ),
            )
        ]
    )
    failure = ToolResult(
        content=[
            mcp_types.TextContent(
                type="text",
                text=json.dumps(
                    {
                        "success": False,
                        "error": "denied",
                        "error_type": "PERMISSION",
                    }
                ),
            )
        ]
    )

    assert middleware._is_error_response(success) is False
    assert middleware._is_error_response(failure) is True
