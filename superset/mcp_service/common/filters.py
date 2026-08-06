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

"""MCP list-filter schemas kept separate from Superset's shared DAO layer."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ColumnOperatorEnum(str, Enum):
    eq = "eq"
    ne = "ne"
    sw = "sw"
    ew = "ew"
    in_ = "in"
    nin = "nin"
    gt = "gt"
    gte = "gte"
    lt = "lt"
    lte = "lte"
    like = "like"
    ilike = "ilike"
    is_null = "is_null"
    is_not_null = "is_not_null"

    def apply(self, column: Any, value: Any) -> Any:
        if self == self.eq:
            return column == value
        if self == self.ne:
            return column != value
        if self == self.sw:
            return column.like(f"{value}%")
        if self == self.ew:
            return column.like(f"%{value}")
        if self == self.in_:
            return column.in_(value if isinstance(value, (list, tuple)) else [value])
        if self == self.nin:
            return ~column.in_(value if isinstance(value, (list, tuple)) else [value])
        if self == self.gt:
            return column > value
        if self == self.gte:
            return column >= value
        if self == self.lt:
            return column < value
        if self == self.lte:
            return column <= value
        if self == self.like:
            return column.like(f"%{value}%")
        if self == self.ilike:
            return column.ilike(f"%{value}%")
        if self == self.is_null:
            return column.is_(None)
        if self == self.is_not_null:
            return column.isnot(None)
        raise ValueError(f"Unsupported operator: {self}")


class ColumnOperator(BaseModel):
    col: str = Field(..., description="Column name to filter on")
    opr: ColumnOperatorEnum = Field(..., description="Operator")
    value: Any = Field(None, description="Value for the filter")


__all__ = ["ColumnOperator", "ColumnOperatorEnum"]
