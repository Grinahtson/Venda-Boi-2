import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);

  try {
    // Buscar todas as funções no esquema public
    const funcs = await client`
      SELECT proname, pg_get_function_identity_arguments(oid) as arg_types
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace;
    `;

    console.log("Found functions:", funcs.map(f => `${f.proname}(${f.arg_types})`));

    // Consertando as funções avisadas
    for (const f of funcs) {
      if (f.proname === 'definir_atualizado_em' || f.proname === 'set_updated_at_metadata' || f.proname === 'set_updated_at') {
        const query = `ALTER FUNCTION public."${f.proname}"(${f.arg_types}) SET search_path = public;`;
        console.log(`Executando: ${query}`);
        await client.unsafe(query);
      }
    }

    console.log("✅ Funções atualizadas com sucesso!");
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.end();
  }
}

main();
