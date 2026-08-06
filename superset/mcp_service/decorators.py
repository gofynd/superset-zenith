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

"""MCP tool and prompt registration for the Superset 4.1 backport."""

import logging
from typing import Any, Callable, TypeVar

from mcp.types import ToolAnnotations

F = TypeVar("F", bound=Callable[..., Any])

logger = logging.getLogger(__name__)


def tool(
    func_or_name: str | Callable[..., Any] | None = None,
    *,
    name: str | None = None,
    description: str | None = None,
    tags: list[str] | None = None,
    protect: bool = True,
    class_permission_name: str | None = None,
    method_permission_name: str | None = None,
    annotations: ToolAnnotations | None = None,
) -> Callable[[F], F] | F:
    """Register a FastMCP tool with Superset authentication and RBAC metadata."""
    registered_name = func_or_name if isinstance(func_or_name, str) else name

    def decorator(func: F) -> F:
        from fastmcp.tools import Tool

        from superset.mcp_service.app import mcp

        tool_name = registered_name or func.__name__
        tool_tags = tags or []

        if class_permission_name:
            from superset.mcp_service.auth import (
                CLASS_PERMISSION_ATTR,
                METHOD_PERMISSION_ATTR,
            )

            setattr(func, CLASS_PERMISSION_ATTR, class_permission_name)
            setattr(
                func,
                METHOD_PERMISSION_ATTR,
                method_permission_name
                or ("write" if "mutate" in tool_tags else "read"),
            )

        if protect:
            from superset.mcp_service.auth import mcp_auth_hook

            wrapped_func = mcp_auth_hook(func)
        else:
            wrapped_func = func

        mcp.add_tool(
            Tool.from_function(
                wrapped_func,
                name=tool_name,
                description=description or func.__doc__ or f"Tool: {tool_name}",
                tags=tool_tags,
                annotations=annotations,
            )
        )
        logger.info("Registered MCP tool: %s", tool_name)
        return wrapped_func

    if callable(func_or_name):
        return decorator(func_or_name)
    return decorator


def prompt(
    func_or_name: str | Callable[..., Any] | None = None,
    *,
    name: str | None = None,
    title: str | None = None,
    description: str | None = None,
    tags: set[str] | None = None,
    protect: bool = True,
) -> Callable[[F], F] | F:
    """Register a FastMCP prompt with Superset authentication."""
    registered_name = func_or_name if isinstance(func_or_name, str) else name

    def decorator(func: F) -> F:
        from superset.mcp_service.app import mcp

        prompt_name = registered_name or func.__name__
        if protect:
            from superset.mcp_service.auth import mcp_auth_hook

            wrapped_func = mcp_auth_hook(func)
        else:
            wrapped_func = func

        mcp.prompt(
            name=prompt_name,
            title=title or func.__name__,
            description=description or func.__doc__ or f"Prompt: {prompt_name}",
            tags=tags or set(),
        )(wrapped_func)
        logger.info("Registered MCP prompt: %s", prompt_name)
        return wrapped_func

    if callable(func_or_name):
        return decorator(func_or_name)
    return decorator


__all__ = ["prompt", "tool", "ToolAnnotations"]
