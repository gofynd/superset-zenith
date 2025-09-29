export SUPERSET=https://superset.intelligence.fynd.com
# export SUPERSET=https://superset.intelligence.sit.fyndx1.de
export RUN_MANIFEST_LOCAL=true
# export BOLTIC_STREAMS_METHODS=trackSubmit,trackClick,trackLink,trackForm,pageview,identify,reset,group,track,ready,alias,debug,page,once,off,on,addSourceMiddleware,addIntegrationMiddleware,setAnonymousId,addDestinationMiddleware
export BOLTIC_STREAMS_KEY=Zc7Og8DXevJG85xZyjKPJBAgkOITWUdtpDB8EsyQWxyx8JgqZIsGz-smhWqpsCcLJ0_wPw-3_NMkljT0x1SLsQ
export BOLTIC_STREAMS_CHART_TRIGGER_THRESHOLDS=[{"chartId":152,"threshold":330000},{"chartId":248,"threshold":10000}]

# Sentry Configuration
export MJS_SENTRY_DSN=https://2b84b4e66780eedb23cac77ee8a579ac@o4510101081161728.ingest.us.sentry.io/4510101085093888
export MJS_SENTRY_ENVIRONMENT=development
export MJS_SENTRY_RELEASE=superset@4.1.3

# Run dev server on custom host and port
export ASSET_BASE_URL=/superset
export DEV_SERVER_HOST=localdev.intelligence.fynd.com
# npm run dev-server -- --port=9001
npm run dev-server -- --port=9001 --host=localdev.intelligence.fynd.com
