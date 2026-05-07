function getCidadesEstados() {
  return [
    {
      estado: "SP",
      cidades: ["Sao Paulo", "Campinas", "Ribeirao Preto", "Bauru", "Sorocaba"],
    },
    {
      estado: "RJ",
      cidades: [
        "Rio de Janeiro",
        "Niteroi",
        "Duque de Caxias",
        "Sao Joao de Meriti",
      ],
    },
    {
      estado: "MG",
      cidades: [
        "Belo Horizonte",
        "Uberlandia",
        "Juiz de Fora",
        "Montes Claros",
      ],
    },
    {
      estado: "BA",
      cidades: [
        "Salvador",
        "Feira de Santana",
        "Vitoria da Conquista",
        "Ilheus",
      ],
    },
    {
      estado: "SC",
      cidades: ["Florianopolis", "Blumenau", "Joinville", "Chapeco"],
    },
    {
      estado: "RS",
      cidades: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Santa Maria"],
    },
    {
      estado: "PA",
      cidades: ["Belem", "Ananindeua", "Santarem", "Maraba"],
    },
    {
      estado: "CE",
      cidades: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanau"],
    },
    {
      estado: "PE",
      cidades: ["Recife", "Jaboatao dos Guararapes", "Olinda", "Caruaru"],
    },
    {
      estado: "PR",
      cidades: ["Curitiba", "Londrina", "Maringa", "Ponta Grossa"],
    },
  ];
}

module.exports = {
  getCidadesEstados,
};
