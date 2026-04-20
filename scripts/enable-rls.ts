import postgres from "postgres";


async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);

  try {
    const tables = await client`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `;

    console.log(`Encontradas ${tables.length} tabelas no schema public.`);

    for (const table of tables) {
      console.log(`Ativando RLS para a tabela: ${table.tablename}`);
      await client.unsafe(`ALTER TABLE public."${table.tablename}" ENABLE ROW LEVEL SECURITY;`);
    }

    console.log("✅ Row Level Security (RLS) ativada com sucesso para todas as tabelas!");
  } catch (error) {
    console.error("Erro ao ativar RLS:", error);
  } finally {
    await client.end();
  }
}

main();
