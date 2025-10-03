import { useEffect, useState } from "react";
import { getMinisterios, getVoluntarios, getDemandas } from "@/services/ministryService";

export default function MinisteriosPage() {
  const [ministerios, setMinisterios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [voluntarios, setVoluntarios] = useState([]);
  const [demandas, setDemandas] = useState([]);

  useEffect(() => {
    getMinisterios().then(setMinisterios).catch(console.error);
  }, []);

  const handleSelect = async (ministry) => {
    setSelected(ministry);
    setVoluntarios(await getVoluntarios(ministry.id));
    setDemandas(await getDemandas(ministry.id));
  };

  return (
    <div className="p-6 grid grid-cols-3 gap-6">
      {/* Lista Ministérios */}
      <div className="col-span-1">
        <h2 className="text-xl font-bold mb-4">📋 Ministérios</h2>
        <ul className="space-y-2">
          {ministerios.map((m) => (
            <li
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`p-3 rounded-xl shadow cursor-pointer hover:bg-gray-100 ${
                selected?.id === m.id ? "bg-blue-100" : ""
              }`}
            >
              <p className="font-semibold">{m.nome}</p>
              <p className="text-sm text-gray-600">{m.descricao}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Voluntários */}
      <div className="col-span-1">
        <h2 className="text-xl font-bold mb-4">🙋 Voluntários</h2>
        {voluntarios.length === 0 && <p className="text-gray-500">Selecione um ministério</p>}
        <ul className="space-y-2">
          {voluntarios.map((v) => (
            <li key={v.id} className="p-3 bg-white rounded-xl shadow">
              <p>{v.user.email}</p>
              <span className="text-xs text-gray-500">{v.role}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Demandas */}
      <div className="col-span-1">
        <h2 className="text-xl font-bold mb-4">✅ Demandas</h2>
        {demandas.length === 0 && <p className="text-gray-500">Nenhuma demanda encontrada</p>}
        <ul className="space-y-2">
          {demandas.map((d) => (
            <li key={d.id} className="p-3 bg-white rounded-xl shadow">
              <p className="font-semibold">{d.task}</p>
              <p className="text-sm text-gray-500">Evento: {d.evento?.nome ?? "—"}</p>
              <p className="text-sm text-gray-500">Voluntário: {d.voluntario?.user?.email ?? "—"}</p>
              <span
                className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                  d.status === "concluido"
                    ? "bg-green-200 text-green-800"
                    : d.status === "em_andamento"
                    ? "bg-yellow-200 text-yellow-800"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {d.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
