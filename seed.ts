import { v4 as uuid } from 'uuid'
import { getDatabase } from './connection'
import { users, products, treatedAreas, appSettings, treatmentCategories, consentTemplates } from './schema'
import { eq } from 'drizzle-orm'

export function seedDatabase(): void {
  const db = getDatabase()

  console.log('[DB] Seeding database...')

  // ── Default practitioner ──────────────────────────────────────
  const existingUsers = db.select().from(users).all()
  if (existingUsers.length === 0) {
    const userId = uuid()
    db.insert(users)
      .values({
        id: userId,
        name: 'Dr. Warren',
        role: 'practitioner'
      })
      .run()

    // Save as active practitioner
    const existingPref = db.select().from(appSettings).where(eq(appSettings.key, 'active_practitioner_id')).get()
    if (!existingPref) {
      db.insert(appSettings).values({ key: 'active_practitioner_id', value: userId }).run()
    }

    console.log('[DB] Created default practitioner')
  }

  // ── Treatment Categories ─────────────────────────────────────
  const existingCategories = db.select().from(treatmentCategories).all()
  if (existingCategories.length === 0) {
    const categoryData = [
      // Facial categories (slugs match existing products.category values)
      { name: 'Neurotoxin', slug: 'neurotoxin', type: 'facial', color: '#3B82F6', sortOrder: 1 },
      { name: 'Filler', slug: 'filler', type: 'facial', color: '#EC4899', sortOrder: 2 },
      { name: 'Microneedling', slug: 'microneedling', type: 'facial', color: '#F59E0B', sortOrder: 3 },
      // Dental categories
      { name: 'Whitening', slug: 'whitening', type: 'dental', color: '#FBBF24', sortOrder: 10 },
      { name: 'Veneer', slug: 'veneer', type: 'dental', color: '#F0FDFA', sortOrder: 11 },
      { name: 'Bonding', slug: 'bonding', type: 'dental', color: '#A78BFA', sortOrder: 12 },
      { name: 'Crowns & Bridges', slug: 'crowns-bridges', type: 'dental', color: '#D4A574', sortOrder: 13 },
      { name: 'Orthodontics / Aligners', slug: 'orthodontics', type: 'dental', color: '#60A5FA', sortOrder: 14 },
      { name: 'Implants', slug: 'implants', type: 'dental', color: '#94A3B8', sortOrder: 15 },
      { name: 'Gum Contouring', slug: 'gum-contouring', type: 'dental', color: '#FB7185', sortOrder: 16 },
      { name: 'Resin Infiltration', slug: 'resin-infiltration', type: 'dental', color: '#34D399', sortOrder: 17 }
    ]

    for (const c of categoryData) {
      db.insert(treatmentCategories)
        .values({ id: uuid(), ...c })
        .run()
    }
    console.log('[DB] Seeded', categoryData.length, 'treatment categories')
  }

  // ── Products (injectable catalog) ─────────────────────────────
  const existingProducts = db.select().from(products).all()
  if (existingProducts.length === 0) {
    const productData = [
      // Neurotoxins
      { name: 'Botox', brand: 'Allergan', category: 'neurotoxin', unitType: 'units', color: '#3B82F6' },
      { name: 'Botox Cosmetic', brand: 'Allergan', category: 'neurotoxin', unitType: 'units', color: '#2563EB' },
      { name: 'Dysport', brand: 'Galderma', category: 'neurotoxin', unitType: 'units', color: '#8B5CF6' },
      { name: 'Xeomin', brand: 'Merz', category: 'neurotoxin', unitType: 'units', color: '#6366F1' },
      // Fillers
      { name: 'Belotero', brand: 'Merz', category: 'filler', unitType: 'ml', color: '#EC4899' },
      { name: 'Emervel', brand: 'Galderma', category: 'filler', unitType: 'ml', color: '#F43F5E' },
      { name: 'Juvederm Ultra', brand: 'Allergan', category: 'filler', unitType: 'ml', color: '#F97316' },
      { name: 'Juvederm Ultra Plus', brand: 'Allergan', category: 'filler', unitType: 'ml', color: '#FB923C' },
      { name: 'Restylane', brand: 'Galderma', category: 'filler', unitType: 'ml', color: '#14B8A6' },
      { name: 'Teosyal', brand: 'Teoxane', category: 'filler', unitType: 'ml', color: '#06B6D4' },
      { name: 'Perlane', brand: 'Galderma', category: 'filler', unitType: 'ml', color: '#0EA5E9' },
      { name: 'Sculptra', brand: 'Galderma', category: 'filler', unitType: 'vial', color: '#10B981' }
    ]

    for (const p of productData) {
      db.insert(products)
        .values({ id: uuid(), ...p })
        .run()
    }
    console.log('[DB] Seeded', productData.length, 'facial products')
  }

  // ── Dental Products (separate check — may already have facial products) ──
  const existingDentalProducts = db
    .select()
    .from(products)
    .where(eq(products.category, 'veneer'))
    .all()
  if (existingDentalProducts.length === 0) {
    const dentalProductData = [
      // Veneers
      { name: 'E.max Press', brand: 'Ivoclar', category: 'veneer', unitType: 'unit', color: '#F0FDFA' },
      { name: 'Lumineers', brand: 'DenMat', category: 'veneer', unitType: 'unit', color: '#ECFDF5' },
      { name: 'Empress', brand: 'Ivoclar', category: 'veneer', unitType: 'unit', color: '#F0FDF4' },
      // Aligners / Orthodontics
      { name: 'Invisalign', brand: 'Align Technology', category: 'orthodontics', unitType: 'tray', color: '#60A5FA' },
      { name: 'ClearCorrect', brand: 'Straumann', category: 'orthodontics', unitType: 'tray', color: '#93C5FD' },
      { name: 'SureSmile', brand: 'Dentsply Sirona', category: 'orthodontics', unitType: 'tray', color: '#BFDBFE' },
      // Whitening
      { name: 'ZOOM', brand: 'Philips', category: 'whitening', unitType: 'session', color: '#FBBF24' },
      { name: 'Opalescence Boost', brand: 'Ultradent', category: 'whitening', unitType: 'session', color: '#FDE68A' },
      { name: 'KöR Whitening', brand: 'KöR', category: 'whitening', unitType: 'session', color: '#FEF3C7' },
      // Bonding / Composites
      { name: 'Venus Diamond', brand: 'Kulzer', category: 'bonding', unitType: 'syringe', color: '#A78BFA' },
      { name: 'Filtek Supreme', brand: '3M', category: 'bonding', unitType: 'syringe', color: '#C4B5FD' },
      { name: 'Clearfil Majesty', brand: 'Kuraray', category: 'bonding', unitType: 'syringe', color: '#DDD6FE' },
      // Resin Infiltration
      { name: 'ICON', brand: 'DMG', category: 'resin-infiltration', unitType: 'application', color: '#34D399' },
      // Crowns & Bridges
      { name: 'Zirconia Crown', brand: 'Generic', category: 'crowns-bridges', unitType: 'unit', color: '#D4A574' },
      { name: 'PFM Crown', brand: 'Generic', category: 'crowns-bridges', unitType: 'unit', color: '#C9A67E' },
      // Implants
      { name: 'Straumann BLT', brand: 'Straumann', category: 'implants', unitType: 'unit', color: '#94A3B8' },
      { name: 'Nobel Biocare Active', brand: 'Nobel Biocare', category: 'implants', unitType: 'unit', color: '#CBD5E1' },
      // Gum Contouring
      { name: 'Diode Laser Gingivectomy', brand: 'Generic', category: 'gum-contouring', unitType: 'session', color: '#FB7185' }
    ]

    for (const p of dentalProductData) {
      db.insert(products)
        .values({ id: uuid(), ...p })
        .run()
    }
    console.log('[DB] Seeded', dentalProductData.length, 'dental products')
  }

  // ── Treated Areas (Facial) ──────────────────────────────────────
  const existingAreas = db.select().from(treatedAreas).all()
  if (existingAreas.length === 0) {
    const areaData = [
      { name: 'Brow Lift', color: '#F59E0B' },
      { name: "Crow's Feet", color: '#8B5CF6' },
      { name: 'Frontalis', color: '#3B82F6' },
      { name: 'Glabella', color: '#22C55E' },
      { name: 'Lower Face', color: '#EF4444' },
      { name: 'Mid Face', color: '#F97316' },
      { name: 'Platysma', color: '#14B8A6' },
      { name: 'Occipital', color: '#6366F1' },
      { name: 'TMD', color: '#EC4899' }
    ]

    for (const a of areaData) {
      db.insert(treatedAreas)
        .values({ id: uuid(), ...a })
        .run()
    }
    console.log('[DB] Seeded', areaData.length, 'facial treated areas')
  }

  // ── Dental Treated Areas (separate check) ───────────────────────
  const existingDentalAreas = db
    .select()
    .from(treatedAreas)
    .where(eq(treatedAreas.name, 'Upper Right Quadrant (11-18)'))
    .all()
  if (existingDentalAreas.length === 0) {
    const dentalAreaData = [
      // Quadrants (FDI notation)
      { name: 'Upper Right Quadrant (11-18)', color: '#3B82F6' },
      { name: 'Upper Left Quadrant (21-28)', color: '#8B5CF6' },
      { name: 'Lower Left Quadrant (31-38)', color: '#22C55E' },
      { name: 'Lower Right Quadrant (41-48)', color: '#F59E0B' },
      // Zones
      { name: 'Upper Anteriors', color: '#06B6D4' },
      { name: 'Lower Anteriors', color: '#14B8A6' },
      { name: 'Upper Premolars', color: '#F97316' },
      { name: 'Lower Premolars', color: '#FB923C' },
      { name: 'Upper Molars', color: '#EF4444' },
      { name: 'Lower Molars', color: '#F43F5E' },
      // Full arches
      { name: 'Full Upper Arch', color: '#6366F1' },
      { name: 'Full Lower Arch', color: '#A78BFA' }
    ]

    for (const a of dentalAreaData) {
      db.insert(treatedAreas)
        .values({ id: uuid(), ...a })
        .run()
    }
    console.log('[DB] Seeded', dentalAreaData.length, 'dental treated areas')
  }

  // ── Default Consent Templates ─────────────────────────────────
  const existingTemplates = db.select().from(consentTemplates).all()
  if (existingTemplates.length === 0) {
    const templateData = [
      {
        name: 'Botulinum Toxin Consent',
        type: 'botulinum',
        isDefault: true,
        contentJson: JSON.stringify({
          title: 'Consent for Botulinum Toxin Treatment',
          sections: [
            {
              heading: 'Purpose of Treatment',
              body: 'Botulinum toxin (e.g. Botox®, Dysport®, Xeomin®) is a prescription medication injected into muscles to temporarily reduce the appearance of moderate to severe wrinkles, or to treat other medical conditions such as TMD/TMJ disorders, migraines, and hyperhidrosis. The effects typically last 3–6 months.'
            },
            {
              heading: 'Risks and Side Effects',
              body: 'Common side effects include temporary redness, swelling, bruising, or tenderness at the injection site. Less common risks include headache, flu-like symptoms, drooping of the eyelid or eyebrow (ptosis), asymmetry, dry eyes, and allergic reactions. Rare but serious complications may include difficulty swallowing, breathing, or speaking if the toxin spreads beyond the injection site.'
            },
            {
              heading: 'Contraindications',
              body: 'This treatment is not recommended for individuals who are pregnant or breastfeeding, have a neuromuscular disease (e.g. myasthenia gravis, Lambert-Eaton syndrome), are allergic to any botulinum toxin product or its ingredients, or have an active infection at the planned injection site.'
            },
            {
              heading: 'Alternatives',
              body: 'Alternatives to botulinum toxin treatment include dermal fillers, chemical peels, laser resurfacing, microneedling, topical retinoids, or no treatment at all. Each alternative has its own risks and benefits, which can be discussed with your practitioner.'
            },
            {
              heading: 'Aftercare Instructions',
              body: 'Do not rub or massage the treated area for 24 hours. Avoid lying down for 4 hours after treatment. Avoid strenuous exercise, alcohol, and excessive heat (saunas, hot tubs) for 24 hours. Contact the clinic immediately if you experience difficulty breathing, swallowing, or any signs of a severe allergic reaction.'
            }
          ],
          acknowledgment: 'I have read and understood the information provided above. I have had the opportunity to ask questions and have received satisfactory answers. I voluntarily consent to the botulinum toxin treatment as described by my practitioner.'
        })
      },
      {
        name: 'Dermal Filler Consent',
        type: 'filler',
        isDefault: true,
        contentJson: JSON.stringify({
          title: 'Consent for Dermal Filler Treatment',
          sections: [
            {
              heading: 'Purpose of Treatment',
              body: 'Dermal fillers (e.g. Juvederm®, Restylane®, Belotero®, Sculptra®) are injectable gel substances used to restore facial volume, smooth wrinkles and folds, enhance lips, and improve facial contours. Results are typically visible immediately and may last 6–24 months depending on the product used.'
            },
            {
              heading: 'Risks and Side Effects',
              body: 'Common side effects include temporary swelling, redness, bruising, tenderness, and firmness at the injection site. Less common risks include lumps, asymmetry, migration of filler, infection, and allergic reactions. Rare but serious complications include vascular occlusion (blockage of blood vessels) which may lead to tissue necrosis or, in extremely rare cases, vision impairment or blindness.'
            },
            {
              heading: 'Contraindications',
              body: 'This treatment is not recommended for individuals who are pregnant or breastfeeding, have active skin infections or inflammation at the treatment site, have a history of severe allergic reactions or anaphylaxis, have autoimmune conditions, or are taking blood-thinning medications without medical clearance.'
            },
            {
              heading: 'Alternatives',
              body: 'Alternatives include botulinum toxin injections, fat transfer, surgical procedures (e.g. facelift), laser treatments, or no treatment. Your practitioner can discuss the benefits and risks of each alternative.'
            },
            {
              heading: 'Aftercare Instructions',
              body: 'Avoid touching or massaging the treated area for 24 hours unless instructed otherwise. Apply ice gently to reduce swelling. Avoid strenuous exercise, alcohol, and excessive sun or heat exposure for 48 hours. Report any signs of unusual pain, skin discoloration, or vision changes to the clinic immediately.'
            }
          ],
          acknowledgment: 'I have read and understood the information provided above. I have had the opportunity to ask questions and have received satisfactory answers. I voluntarily consent to the dermal filler treatment as described by my practitioner.'
        })
      },
      {
        name: 'Photography Consent',
        type: 'photo',
        isDefault: true,
        contentJson: JSON.stringify({
          title: 'Consent for Clinical Photography',
          sections: [
            {
              heading: 'Purpose',
              body: 'Clinical photographs are taken to document your condition before, during, and after treatment. These photographs become part of your medical record and are used to monitor progress, plan treatment, and ensure the highest quality of care.'
            },
            {
              heading: 'Usage of Photographs',
              body: 'With your permission, de-identified photographs (with no personally identifiable information) may be used for educational purposes, professional presentations, academic publications, or marketing materials. Your identity will be protected in all such uses. You may decline educational use without affecting your treatment in any way.'
            },
            {
              heading: 'Revocation',
              body: 'You may revoke your consent for the educational or marketing use of your photographs at any time by notifying the clinic in writing. Revocation does not affect the use of photographs as part of your medical record, nor any uses that occurred prior to revocation.'
            }
          ],
          acknowledgment: 'I consent to having clinical photographs taken for my medical record. I understand that I may separately agree or decline to have my de-identified photographs used for educational or marketing purposes.'
        })
      },
      {
        name: 'General Dental Consent',
        type: 'dental_general',
        isDefault: true,
        contentJson: JSON.stringify({
          title: 'Consent for Cosmetic Dental Treatment',
          sections: [
            {
              heading: 'Purpose of Treatment',
              body: 'Cosmetic dental treatments (including but not limited to veneers, bonding, whitening, orthodontic aligners, crowns, bridges, implants, and gum contouring) are performed to improve the appearance, function, and health of your teeth and smile. Your practitioner will discuss the specific procedures recommended for your case.'
            },
            {
              heading: 'Risks and Complications',
              body: 'General risks of cosmetic dental procedures include tooth sensitivity, discomfort or pain, allergic reactions to materials, damage to existing dental work, nerve injury, infection, and unsatisfactory aesthetic results. Specific risks vary by procedure: veneers require irreversible enamel removal; whitening may cause temporary sensitivity; implants carry surgical risks including bone loss; orthodontic treatment may cause root resorption.'
            },
            {
              heading: 'Alternatives',
              body: 'Depending on your condition, alternatives may include different cosmetic approaches, restorative treatments, or no treatment. Your practitioner will discuss all available options, including their respective benefits, risks, and costs.'
            },
            {
              heading: 'Aftercare and Expectations',
              body: 'Follow all post-treatment instructions provided by your practitioner. Attend all scheduled follow-up appointments. Results may vary and additional treatments may be necessary to achieve desired outcomes. Maintain good oral hygiene and regular dental check-ups to preserve treatment results.'
            }
          ],
          acknowledgment: 'I have read and understood the information provided above. I have had the opportunity to discuss my treatment plan, ask questions, and receive satisfactory answers. I voluntarily consent to the cosmetic dental treatment as recommended by my practitioner.'
        })
      }
    ]

    for (const t of templateData) {
      db.insert(consentTemplates)
        .values({ id: uuid(), ...t })
        .run()
    }
    console.log('[DB] Seeded', templateData.length, 'consent templates')
  }

  // ── Default app settings ──────────────────────────────────────
  const existingSettings = db.select().from(appSettings).all()
  if (existingSettings.length === 0) {
    const settings = [
      { key: 'tax_provincial_rate', value: '9.975' },
      { key: 'tax_provincial_label', value: 'QST' },
      { key: 'tax_federal_rate', value: '5' },
      { key: 'tax_federal_label', value: 'GST' },
      { key: 'clinic_name', value: 'ApexRec Clinic' },
      { key: 'currency', value: 'CAD' }
    ]

    for (const s of settings) {
      db.insert(appSettings).values(s).run()
    }
    console.log('[DB] Seeded default settings')
  }

  console.log('[DB] Seeding complete')
}
