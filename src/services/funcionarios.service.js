const auditService = require("./audit.service");
const uniplusService = require("./uniplus.service");

const AUDIT_TABLE = "api_logs";
const RESOURCE = "funcionarios";

// tipo 4 = Vendedor, tipo 5 = Técnico
const TIPOS_FUNCIONARIO = ["4", "5"];

function isFuncionario(entidade, tiposFiltro = TIPOS_FUNCIONARIO) {
  const tipos = String(entidade.tipo || "").split(",").map((t) => t.trim());
  return tipos.some((t) => tiposFiltro.includes(t));
}

function tipoLabel(tipo) {
  const map = { "4": "Vendedor", "5": "Tecnico" };
  return map[tipo] || tipo;
}

function enrichFuncionario(entidade) {
  const tipos = String(entidade.tipo || "").split(",").map((t) => t.trim());
  const tiposFunc = tipos.filter((t) => TIPOS_FUNCIONARIO.includes(t));
  return {
    ...entidade,
    tipoFuncionario: tiposFunc.map(tipoLabel).join(",") || null,
  };
}

async function registrarAuditoria({
  codigo,
  payload,
  operacao,
  status,
  rota,
  metodo,
  userId = null,
  tenantId = null,
}) {
  try {
    await auditService.registrarAuditoria({
      table: AUDIT_TABLE,
      recurso: RESOURCE,
      rota,
      metodo,
      codigo,
      payload,
      operacao,
      status,
      userId,
      tenantId,
    });
  } catch (error) {
    console.error(
      "⚠️ Erro ao registrar auditoria de funcionario:",
      error.message,
    );
  }
}

async function listarFuncionarios(filtros = {}, context = {}) {
  const { userId, tenantId } = context;
  try {
    const params = {};
    if (filtros.codigo) params["codigo.eq"] = filtros.codigo;
    if (filtros.nome) params["nome.ge"] = filtros.nome;
    if (filtros.cnpjCpf) params["cnpjCpf.eq"] = filtros.cnpjCpf;

    const data = await uniplusService.listarEntidades({ all: true, params });

    let lista = Array.isArray(data)
      ? data
      : data?.data || data?.items || data?.registros || [];

    let tiposFiltro = TIPOS_FUNCIONARIO;
    if (filtros.tipo === "vendedor") tiposFiltro = ["4"];
    else if (filtros.tipo === "tecnico") tiposFiltro = ["5"];

    const funcionarios = lista
      .filter((e) => isFuncionario(e, tiposFiltro))
      .map(enrichFuncionario);

    const offset = Number(filtros.offset) || 0;
    const limit = filtros.limit ? Number(filtros.limit) : undefined;
    const paginados = limit
      ? funcionarios.slice(offset, offset + limit)
      : funcionarios.slice(offset);

    await registrarAuditoria({
      codigo: null,
      payload: filtros,
      operacao: "LISTAR",
      status: "SUCESSO",
      rota: "/api/funcionarios",
      metodo: "GET",
      userId,
      tenantId,
    });

    return {
      items: paginados,
      pagination: {
        limit: limit ?? paginados.length,
        offset,
        total: funcionarios.length,
      },
    };
  } catch (error) {
    registrarAuditoria({
      codigo: null,
      payload: filtros,
      operacao: "LISTAR",
      status: "FALHA",
      rota: "/api/funcionarios",
      metodo: "GET",
      userId,
      tenantId,
    }).catch(() => {});
    throw error;
  }
}

async function obterFuncionario(codigo, context = {}) {
  const { userId, tenantId } = context;
  try {
    const data = await uniplusService.obterEntidadePorCodigo(codigo);

    if (!isFuncionario(data)) {
      const err = new Error(
        `Entidade ${codigo} nao e um funcionario (tipo 4 ou 5).`,
      );
      err.status = 404;
      throw err;
    }

    await registrarAuditoria({
      codigo,
      payload: { codigo },
      operacao: "CONSULTAR",
      status: "SUCESSO",
      rota: `/api/funcionarios/${codigo}`,
      metodo: "GET",
      userId,
      tenantId,
    });

    return enrichFuncionario(data);
  } catch (error) {
    registrarAuditoria({
      codigo,
      payload: { codigo },
      operacao: "CONSULTAR",
      status: "FALHA",
      rota: `/api/funcionarios/${codigo}`,
      metodo: "GET",
      userId,
      tenantId,
    }).catch(() => {});
    throw error;
  }
}

module.exports = { listarFuncionarios, obterFuncionario };
