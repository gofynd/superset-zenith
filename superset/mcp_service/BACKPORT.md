<!--
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# MCP backport for Zenith Superset 4.1.3

This backport imports the MCP service from Apache Superset 6.1.0. Apache
Superset 6.0.0 does not contain the MCP service; 6.1.0 is the first release
baseline that does.

The existing 4.1.3 application remains the source of truth. The compatibility
layer deliberately reuses:

- the existing chart, dashboard, dataset, and database DAOs and their base RBAC
  filters;
- the 4.1 SQL Lab command, query rendering, access validation, timeout, and
  synchronous execution pipeline;
- Flask-AppBuilder 4 roles without depending on the FAB 5 group model; and
- the existing Superset Flask application and metadata database.

FastMCP is an optional dependency because it requires Python 3.10 or newer,
while the 4.1.3 package metadata still permits Python 3.9. The project Docker
image uses Python 3.11 and installs the pinned, upstream-tested FastMCP 3.1.0.

## Development

Set a dedicated development identity in `superset_config.py`:

```python
MCP_DEV_USERNAME = "admin"
```

Then build and start the opt-in service:

```bash
docker compose --profile mcp up --build superset-mcp
```

The streamable HTTP endpoint is `http://localhost:5008/mcp`. To change only
the exposed host port, set `MCP_PORT` before running Compose.

The equivalent direct command in a Python 3.10+ environment installed with
`pip install -e '.[fastmcp]'` is:

```bash
superset mcp run --host 0.0.0.0 --port 5008
```

## Production gate

Do not configure `MCP_DEV_USERNAME` in production. Configure
`MCP_AUTH_ENABLED = True` with exactly one supported JWT verification source
(`MCP_JWKS_URI`, `MCP_JWT_PUBLIC_KEY`, or `MCP_JWT_SECRET`) and keep
`MCP_RBAC_ENABLED = True`. Expose `/mcp` through the authenticated TLS ingress,
not the container port directly.

Before rollout, validate a representative account for each deployed role
against read, SQL execution, chart creation/update, and dashboard mutation.
The MCP process shares the same metadata database and permissions as the web
application, so no schema migration is introduced by this backport.
