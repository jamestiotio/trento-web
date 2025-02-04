defmodule Trento.Domain.Events.ChecksSelected do
  @moduledoc """
  Event of the checks selected in a cluster.
  """

  use Trento.Event

  defevent do
    field :cluster_id, Ecto.UUID
    field :checks, {:array, :string}
  end
end
