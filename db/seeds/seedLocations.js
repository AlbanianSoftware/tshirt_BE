// server/db/seeds/workingSeed.js - RAW SQL VERSION THAT ACTUALLY WORKS
import mysql from "mysql2/promise";
import "dotenv/config";

async function seed() {
  let connection;

  try {
    console.log("🌍 Connecting to database...\n");

    // Create direct connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "tshirt_customizer",
    });

    console.log("✅ Connected!\n");

    // Check current data
    const [existingCountries] = await connection.execute(
      "SELECT * FROM countries"
    );
    console.log(`📊 Current countries: ${existingCountries.length}`);

    if (existingCountries.length > 0) {
      console.log("\n⚠️  Data already exists!");

      if (process.argv.includes("--force")) {
        console.log("🗑️  Deleting existing data...");
        await connection.execute("DELETE FROM cities");
        await connection.execute("DELETE FROM countries");
        console.log("✅ Deleted!\n");
      } else {
        console.log("Run with --force to delete and reseed");
        await connection.end();
        return;
      }
    }

    console.log("➕ Inserting countries...\n");

    // Insert countries
    await connection.execute(`
      INSERT INTO countries (name, code, capital_city, is_active, sort_order) VALUES
      ('Albania', 'AL', 'Tirana', 1, 1),
      ('Kosovo', 'XK', 'Pristina', 1, 2),
      ('North Macedonia', 'MK', 'Skopje', 1, 3),
      ('Montenegro', 'ME', 'Podgorica', 1, 4)
    `);

    console.log("✅ Countries inserted!");

    // Get country IDs
    const [countries] = await connection.execute(
      "SELECT id, name, code FROM countries ORDER BY sort_order"
    );
    countries.forEach((c) =>
      console.log(`   ${c.name} (${c.code}) - ID: ${c.id}`)
    );

    console.log("\n➕ Inserting cities...\n");

    // Get country IDs
    const albania = countries.find((c) => c.code === "AL");
    const kosovo = countries.find((c) => c.code === "XK");
    const macedonia = countries.find((c) => c.code === "MK");
    const montenegro = countries.find((c) => c.code === "ME");

    // Insert Albania cities
    await connection.execute(`
      INSERT INTO cities (country_id, name, is_capital, is_active, sort_order) VALUES
      (${albania.id}, 'Tirana', 1, 1, 0),
      (${albania.id}, 'Durrës', 0, 1, 1),
      (${albania.id}, 'Vlorë', 0, 1, 2),
      (${albania.id}, 'Elbasan', 0, 1, 3),
      (${albania.id}, 'Shkodër', 0, 1, 4),
      (${albania.id}, 'Fier', 0, 1, 5),
      (${albania.id}, 'Korçë', 0, 1, 6),
      (${albania.id}, 'Berat', 0, 1, 7),
      (${albania.id}, 'Lushnjë', 0, 1, 8),
      (${albania.id}, 'Kavajë', 0, 1, 9),
      (${albania.id}, 'Pogradec', 0, 1, 10),
      (${albania.id}, 'Laç', 0, 1, 11),
      (${albania.id}, 'Kukës', 0, 1, 12),
      (${albania.id}, 'Lezhë', 0, 1, 13),
      (${albania.id}, 'Gjirokastër', 0, 1, 14),
      (${albania.id}, 'Sarandë', 0, 1, 15),
      (${albania.id}, 'Patos', 0, 1, 16),
      (${albania.id}, 'Krujë', 0, 1, 17),
      (${albania.id}, 'Kuçovë', 0, 1, 18),
      (${albania.id}, 'Burrel', 0, 1, 19)
    `);
    console.log("✅ Albania: 20 cities");

    // Insert Kosovo cities
    await connection.execute(`
      INSERT INTO cities (country_id, name, is_capital, is_active, sort_order) VALUES
      (${kosovo.id}, 'Pristina', 1, 1, 0),
      (${kosovo.id}, 'Prizren', 0, 1, 1),
      (${kosovo.id}, 'Peja', 0, 1, 2),
      (${kosovo.id}, 'Gjakova', 0, 1, 3),
      (${kosovo.id}, 'Mitrovica', 0, 1, 4),
      (${kosovo.id}, 'Gjilan', 0, 1, 5),
      (${kosovo.id}, 'Ferizaj', 0, 1, 6),
      (${kosovo.id}, 'Podujevo', 0, 1, 7),
      (${kosovo.id}, 'Vushtrri', 0, 1, 8),
      (${kosovo.id}, 'Suhareka', 0, 1, 9),
      (${kosovo.id}, 'Rahovec', 0, 1, 10),
      (${kosovo.id}, 'Drenas', 0, 1, 11),
      (${kosovo.id}, 'Lipjan', 0, 1, 12),
      (${kosovo.id}, 'Malisheva', 0, 1, 13),
      (${kosovo.id}, 'Kaçanik', 0, 1, 14)
    `);
    console.log("✅ Kosovo: 15 cities");

    // Insert North Macedonia cities
    await connection.execute(`
      INSERT INTO cities (country_id, name, is_capital, is_active, sort_order) VALUES
      (${macedonia.id}, 'Skopje', 1, 1, 0),
      (${macedonia.id}, 'Bitola', 0, 1, 1),
      (${macedonia.id}, 'Kumanovo', 0, 1, 2),
      (${macedonia.id}, 'Prilep', 0, 1, 3),
      (${macedonia.id}, 'Tetovo', 0, 1, 4),
      (${macedonia.id}, 'Veles', 0, 1, 5),
      (${macedonia.id}, 'Ohrid', 0, 1, 6),
      (${macedonia.id}, 'Gostivar', 0, 1, 7),
      (${macedonia.id}, 'Štip', 0, 1, 8),
      (${macedonia.id}, 'Strumica', 0, 1, 9),
      (${macedonia.id}, 'Kavadarci', 0, 1, 10),
      (${macedonia.id}, 'Kočani', 0, 1, 11),
      (${macedonia.id}, 'Kičevo', 0, 1, 12),
      (${macedonia.id}, 'Struga', 0, 1, 13),
      (${macedonia.id}, 'Radoviš', 0, 1, 14)
    `);
    console.log("✅ North Macedonia: 15 cities");

    // Insert Montenegro cities
    await connection.execute(`
      INSERT INTO cities (country_id, name, is_capital, is_active, sort_order) VALUES
      (${montenegro.id}, 'Podgorica', 1, 1, 0),
      (${montenegro.id}, 'Nikšić', 0, 1, 1),
      (${montenegro.id}, 'Pljevlja', 0, 1, 2),
      (${montenegro.id}, 'Bijelo Polje', 0, 1, 3),
      (${montenegro.id}, 'Cetinje', 0, 1, 4),
      (${montenegro.id}, 'Bar', 0, 1, 5),
      (${montenegro.id}, 'Herceg Novi', 0, 1, 6),
      (${montenegro.id}, 'Berane', 0, 1, 7),
      (${montenegro.id}, 'Budva', 0, 1, 8),
      (${montenegro.id}, 'Ulcinj', 0, 1, 9),
      (${montenegro.id}, 'Tivat', 0, 1, 10),
      (${montenegro.id}, 'Rožaje', 0, 1, 11),
      (${montenegro.id}, 'Kotor', 0, 1, 12),
      (${montenegro.id}, 'Danilovgrad', 0, 1, 13),
      (${montenegro.id}, 'Mojkovac', 0, 1, 14)
    `);
    console.log("✅ Montenegro: 15 cities");

    // Summary
    const [finalCountries] = await connection.execute(
      "SELECT COUNT(*) as count FROM countries"
    );
    const [finalCities] = await connection.execute(
      "SELECT COUNT(*) as count FROM cities"
    );

    console.log("\n" + "=".repeat(50));
    console.log("🎉 SEED COMPLETE!");
    console.log(`   Countries: ${finalCountries[0].count}`);
    console.log(`   Cities: ${finalCities[0].count}`);
    console.log("=".repeat(50) + "\n");

    await connection.end();
    console.log("✅ Connection closed\n");
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("Stack:", error.stack);
    if (connection) await connection.end();
    process.exit(1);
  }
}

seed();
