Mox.defmock(Trento.Commanded.Mock, for: Commanded.Application)

Application.put_env(:trento, Trento.Commanded, adapter: Trento.Commanded.Mock)

Mox.defmock(Trento.Integration.Telemetry.Mock, for: Trento.Integration.Telemetry.Gen)

Application.put_env(:trento, Trento.Integration.Telemetry,
  adapter: Trento.Integration.Telemetry.Mock
)

Mox.defmock(Trento.Integration.Prometheus.Mock, for: Trento.Integration.Prometheus.Gen)

Application.put_env(:trento, Trento.Integration.Prometheus,
  adapter: Trento.Integration.Prometheus.Mock
)

Mox.defmock(Trento.Infrastructure.Messaging.Adapter.Mock,
  for: Trento.Infrastructure.Messaging.Adapter.Gen
)

Application.put_env(
  :trento,
  Trento.Infrastructure.Messaging,
  adapter: Trento.Infrastructure.Messaging.Adapter.Mock
)

Mox.defmock(GenRMQ.Processor.Mock, for: GenRMQ.Processor)

Mox.defmock(Trento.Support.DateService.Mock, for: Trento.Support.DateService)

Mox.defmock(Joken.CurrentTime.Mock, for: Joken.CurrentTime)
Application.put_env(:joken, :current_time_adapter, Joken.CurrentTime.Mock)

Application.ensure_all_started(:ex_machina, :faker)

ExUnit.start(capture_log: true)
Ecto.Adapters.SQL.Sandbox.mode(Trento.Repo, :manual)
