// server/routes/shipping.js - NEW
import express from "express";
import { db } from "../db/index.js";
import { countries, cities, shippingPrices } from "../db/schema.js"; // 🔥 ADD shippingPrices here
import { eq, and, isNull } from "drizzle-orm"; // 🔥 Also add isNull

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES - Available shipping locations
// ============================================================================

// Get all active countries
router.get("/countries", async (req, res) => {
  try {
    const activeCountries = await db
      .select({
        id: countries.id,
        name: countries.name,
        code: countries.code,
        capitalCity: countries.capitalCity,
      })
      .from(countries)
      .where(eq(countries.isActive, true))
      .orderBy(countries.sortOrder);

    console.log(`✅ Fetched ${activeCountries.length} active countries`);
    res.json(activeCountries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all active cities for a country
router.get("/cities/:countryId", async (req, res) => {
  try {
    const countryId = parseInt(req.params.countryId);

    if (isNaN(countryId)) {
      return res.status(400).json({ message: "Invalid country ID" });
    }

    const activeCities = await db
      .select({
        id: cities.id,
        name: cities.name,
        isCapital: cities.isCapital,
      })
      .from(cities)
      .where(and(eq(cities.countryId, countryId), eq(cities.isActive, true)))
      .orderBy(cities.sortOrder);

    console.log(
      `✅ Fetched ${activeCities.length} cities for country ${countryId}`
    );
    res.json(activeCities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get country details by ID (includes capital info)
router.get("/countries/:id", async (req, res) => {
  try {
    const countryId = parseInt(req.params.id);

    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, countryId));

    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    // Get capital city ID
    const [capitalCity] = await db
      .select()
      .from(cities)
      .where(and(eq(cities.countryId, countryId), eq(cities.isCapital, true)));

    res.json({
      ...country,
      capitalCityId: capitalCity?.id || null,
    });
  } catch (error) {
    console.error("Error fetching country:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Calculate shipping price
router.post("/calculate", async (req, res) => {
  try {
    const { countryId, cityId } = req.body;

    if (!countryId) {
      return res.status(400).json({ message: "Country ID required" });
    }

    // First, try to find city-specific price
    if (cityId) {
      const [cityPrice] = await db
        .select()
        .from(shippingPrices)
        .where(
          and(
            eq(shippingPrices.countryId, parseInt(countryId)),
            eq(shippingPrices.cityId, parseInt(cityId)),
            eq(shippingPrices.isActive, true)
          )
        );

      if (cityPrice) {
        return res.json({ price: parseFloat(cityPrice.price), type: "city" });
      }
    }

    // Fallback to country-wide price
    const [countryPrice] = await db
      .select()
      .from(shippingPrices)
      .where(
        and(
          eq(shippingPrices.countryId, parseInt(countryId)),
          isNull(shippingPrices.cityId),
          eq(shippingPrices.isActive, true)
        )
      );

    if (countryPrice) {
      return res.json({
        price: parseFloat(countryPrice.price),
        type: "country",
      });
    }

    // No shipping price found - default to free
    res.json({ price: 0, type: "default" });
  } catch (error) {
    console.error("Error calculating shipping:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
