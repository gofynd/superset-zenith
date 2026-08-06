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
from __future__ import annotations

from typing import Any, Generic, get_args, TypeVar

import sqlalchemy as sa
from flask_appbuilder.models.filters import BaseFilter
from flask_appbuilder.models.sqla import Model
from flask_appbuilder.models.sqla.interface import SQLAInterface
from sqlalchemy import asc, cast, desc, or_, Text
from sqlalchemy.exc import StatementError
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import ColumnProperty, joinedload, RelationshipProperty

from superset.extensions import db

T = TypeVar("T", bound=Model)


class BaseDAO(Generic[T]):
    """
    Base DAO, implement base CRUD sqlalchemy operations
    """

    model_cls: type[Model] | None = None
    """
    Child classes need to state the Model class so they don't need to implement basic
    create, update and delete methods
    """
    base_filter: BaseFilter | None = None
    """
    Child classes can register base filtering to be applied to all filter methods
    """
    id_column_name = "id"

    def __init_subclass__(cls) -> None:
        cls.model_cls = get_args(
            cls.__orig_bases__[0]  # type: ignore  # pylint: disable=no-member
        )[0]

    @classmethod
    def find_by_id(
        cls,
        model_id: str | int,
        skip_base_filter: bool = False,
        id_column: str | None = None,
        query_options: list[Any] | None = None,
    ) -> T | None:
        """
        Find a model by id, if defined applies `base_filter`
        """
        query = db.session.query(cls.model_cls)
        if query_options:
            query = query.options(*query_options)
        if cls.base_filter and not skip_base_filter:
            data_model = SQLAInterface(cls.model_cls, db.session)
            query = cls.base_filter(  # pylint: disable=not-callable
                cls.id_column_name, data_model
            ).apply(query, None)
        id_column_attr = getattr(cls.model_cls, id_column or cls.id_column_name)
        try:
            return query.filter(id_column_attr == model_id).one_or_none()
        except StatementError:
            # can happen if int is passed instead of a string or similar
            return None

    @classmethod
    def find_by_ids(
        cls,
        model_ids: list[str] | list[int],
        skip_base_filter: bool = False,
    ) -> list[T]:
        """
        Find a List of models by a list of ids, if defined applies `base_filter`
        """
        id_col = getattr(cls.model_cls, cls.id_column_name, None)
        if id_col is None:
            return []
        query = db.session.query(cls.model_cls).filter(id_col.in_(model_ids))
        if cls.base_filter and not skip_base_filter:
            data_model = SQLAInterface(cls.model_cls, db.session)
            query = cls.base_filter(  # pylint: disable=not-callable
                cls.id_column_name, data_model
            ).apply(query, None)
        return query.all()

    @classmethod
    def find_all(cls) -> list[T]:
        """
        Get all that fit the `base_filter`
        """
        query = db.session.query(cls.model_cls)
        if cls.base_filter:
            data_model = SQLAInterface(cls.model_cls, db.session)
            query = cls.base_filter(  # pylint: disable=not-callable
                cls.id_column_name, data_model
            ).apply(query, None)
        return query.all()

    @classmethod
    def find_one_or_none(cls, **filter_by: Any) -> T | None:
        """
        Get the first that fit the `base_filter`
        """
        query = db.session.query(cls.model_cls)
        if cls.base_filter:
            data_model = SQLAInterface(cls.model_cls, db.session)
            query = cls.base_filter(  # pylint: disable=not-callable
                cls.id_column_name, data_model
            ).apply(query, None)
        return query.filter_by(**filter_by).one_or_none()

    @classmethod
    def create(
        cls,
        item: T | None = None,
        attributes: dict[str, Any] | None = None,
    ) -> T:
        """
        Create an object from the specified item and/or attributes.

        :param item: The object to create
        :param attributes: The attributes associated with the object to create
        """

        if not item:
            item = cls.model_cls()  # type: ignore  # pylint: disable=not-callable

        if attributes:
            for key, value in attributes.items():
                setattr(item, key, value)

        db.session.add(item)
        return item  # type: ignore

    @classmethod
    def update(
        cls,
        item: T | None = None,
        attributes: dict[str, Any] | None = None,
    ) -> T:
        """
        Update an object from the specified item and/or attributes.

        :param item: The object to update
        :param attributes: The attributes associated with the object to update
        """

        if not item:
            item = cls.model_cls()  # type: ignore  # pylint: disable=not-callable

        if attributes:
            for key, value in attributes.items():
                setattr(item, key, value)

        if item not in db.session:
            return db.session.merge(item)

        return item  # type: ignore

    @classmethod
    def delete(cls, items: list[T]) -> None:
        """
        Delete the specified items including their associated relationships.

        Note that bulk deletion via `delete` is not invoked in the base class as this
        does not dispatch the ORM `after_delete` event which may be required to augment
        additional records loosely defined via implicit relationships. Instead ORM
        objects are deleted one-by-one via `Session.delete`.

        Subclasses may invoke bulk deletion but are responsible for instrumenting any
        post-deletion logic.

        :param items: The items to delete
        :see: https://docs.sqlalchemy.org/en/latest/orm/queryguide/dml.html
        """

        for item in items:
            db.session.delete(item)

    @classmethod
    def _apply_base_filter(
        cls,
        query: Any,
        skip_base_filter: bool = False,
        data_model: SQLAInterface | None = None,
    ) -> Any:
        if cls.base_filter and not skip_base_filter:
            data_model = data_model or SQLAInterface(cls.model_cls, db.session)
            query = cls.base_filter(  # pylint: disable=not-callable
                cls.id_column_name, data_model
            ).apply(query, None)
        return query

    @classmethod
    def apply_column_operators(
        cls,
        query: Any,
        column_operators: list[Any] | None = None,
    ) -> Any:
        """Apply MCP column filters to a SQLAlchemy query."""
        for column_operator in column_operators or []:
            column_name = column_operator.col
            if not hasattr(cls.model_cls, column_name):
                raise ValueError(
                    f"Invalid filter: column '{column_name}' does not exist on "
                    f"{cls.model_cls.__name__}"
                )

            column = getattr(cls.model_cls, column_name)
            operator = getattr(column_operator.opr, "value", column_operator.opr)
            value = column_operator.value
            if operator == "eq":
                expression = column == value
            elif operator == "ne":
                expression = column != value
            elif operator == "sw":
                expression = column.like(f"{value}%")
            elif operator == "ew":
                expression = column.like(f"%{value}")
            elif operator == "in":
                expression = column.in_(
                    value if isinstance(value, (list, tuple)) else [value]
                )
            elif operator == "nin":
                expression = ~column.in_(
                    value if isinstance(value, (list, tuple)) else [value]
                )
            elif operator == "gt":
                expression = column > value
            elif operator == "gte":
                expression = column >= value
            elif operator == "lt":
                expression = column < value
            elif operator == "lte":
                expression = column <= value
            elif operator == "like":
                expression = column.like(f"%{value}%")
            elif operator == "ilike":
                expression = column.ilike(f"%{value}%")
            elif operator == "is_null":
                expression = column.is_(None)
            elif operator == "is_not_null":
                expression = column.isnot(None)
            else:
                raise ValueError(f"Unsupported operator: {operator}")
            query = query.filter(expression)
        return query

    @classmethod
    def get_filterable_columns_and_operators(cls) -> dict[str, list[str]]:
        """Return model columns and the operators supported by each type."""
        operator_groups = {
            "string": [
                "eq",
                "ne",
                "sw",
                "ew",
                "in",
                "nin",
                "like",
                "ilike",
                "is_null",
                "is_not_null",
            ],
            "boolean": ["eq", "ne", "is_null", "is_not_null"],
            "number": [
                "eq",
                "ne",
                "gt",
                "gte",
                "lt",
                "lte",
                "in",
                "nin",
                "is_null",
                "is_not_null",
            ],
            "datetime": [
                "eq",
                "ne",
                "gt",
                "gte",
                "lt",
                "lte",
                "in",
                "nin",
                "is_null",
                "is_not_null",
            ],
            "default": ["eq", "ne", "is_null", "is_not_null"],
        }
        filterable = {}
        for column in inspect(cls.model_cls).columns:
            if isinstance(column.type, (sa.String, sa.Text)):
                operator_group = "string"
            elif isinstance(column.type, sa.Boolean):
                operator_group = "boolean"
            elif isinstance(column.type, (sa.Integer, sa.Float, sa.Numeric)):
                operator_group = "number"
            elif isinstance(column.type, (sa.DateTime, sa.Date, sa.Time)):
                operator_group = "datetime"
            else:
                operator_group = "default"
            filterable[column.key] = operator_groups[operator_group]

        for name, attribute in vars(cls.model_cls).items():
            if isinstance(attribute, hybrid_property):
                filterable[name] = operator_groups["string"]
        return filterable

    @classmethod
    def _build_query(
        cls,
        column_operators: list[Any] | None = None,
        search: str | None = None,
        search_columns: list[str] | None = None,
        skip_base_filter: bool = False,
        data_model: SQLAInterface | None = None,
    ) -> Any:
        data_model = data_model or SQLAInterface(cls.model_cls, db.session)
        query = data_model.session.query(cls.model_cls)
        query = cls._apply_base_filter(query, skip_base_filter, data_model)
        if search and search_columns:
            search_filters = [
                cast(getattr(cls.model_cls, column_name), Text).ilike(f"%{search}%")
                for column_name in search_columns
                if hasattr(cls.model_cls, column_name)
            ]
            if search_filters:
                query = query.filter(or_(*search_filters))
        return cls.apply_column_operators(query, column_operators)

    @classmethod
    def list(
        cls,
        column_operators: list[Any] | None = None,
        order_column: str = "changed_on",
        order_direction: str = "desc",
        page: int = 0,
        page_size: int = 100,
        search: str | None = None,
        search_columns: list[str] | None = None,
        columns: list[str] | None = None,
    ) -> tuple[list[Any], int]:
        """Return an RBAC-filtered, searchable, paginated model list."""
        data_model = SQLAInterface(cls.model_cls, db.session)
        column_attrs = []
        relationship_loads = []
        needs_full_model = False
        for name in columns or []:
            attribute = getattr(cls.model_cls, name, None)
            if attribute is None:
                continue
            prop = getattr(attribute, "property", None)
            if isinstance(prop, ColumnProperty):
                column_attrs.append(attribute)
            elif isinstance(prop, RelationshipProperty):
                relationship_loads.append(joinedload(attribute))
            else:
                needs_full_model = True

        if relationship_loads or needs_full_model or not column_attrs:
            query = data_model.session.query(cls.model_cls)
        else:
            query = data_model.session.query(*column_attrs)
        query = cls._apply_base_filter(query, data_model=data_model)

        if search and search_columns:
            search_filters = [
                cast(getattr(cls.model_cls, column_name), Text).ilike(f"%{search}%")
                for column_name in search_columns
                if hasattr(cls.model_cls, column_name)
            ]
            if search_filters:
                query = query.filter(or_(*search_filters))

        query = cls.apply_column_operators(query, column_operators)
        total_count = query.count()
        for relationship_load in relationship_loads:
            query = query.options(relationship_load)

        if hasattr(cls.model_cls, order_column):
            order_attribute = getattr(cls.model_cls, order_column)
            order_by = desc if order_direction.lower() == "desc" else asc
            query = query.order_by(order_by(order_attribute))

        page_size = max(page_size, 1)
        items = query.offset(page * page_size).limit(page_size).all()
        return items, total_count

    @classmethod
    def count(
        cls,
        column_operators: list[Any] | None = None,
        skip_base_filter: bool = False,
    ) -> int:
        query = cls._build_query(
            column_operators=column_operators,
            skip_base_filter=skip_base_filter,
        )
        return query.count()
