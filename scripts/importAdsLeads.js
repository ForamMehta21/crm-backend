/**
 * importAdsLeads.js
 *
 * Imports leads from Instagram/Facebook ad data (TSV format) into MongoDB.
 * All leads are tagged with ref: 'FB-Ads-Scarlet'.
 *
 * Usage:
 *   node importAdsLeads.js
 *
 * Environment variables:
 *   MONGODB_URI  - MongoDB connection string
 *   DRY_RUN      - Set to "true" to parse & validate without writing to DB
 */

const mongoose = require('mongoose');
const Lead = require('../models/Lead');
require('dotenv').config();

// ─── Raw TSV data ─────────────────────────────────────────────────────────────
const RAW_TSV = `platform\tare_you_looking_to_buy,_invest,_or_just_explore_options_righ\twhat_is_your_preferred_budget_range_for_your_new_home?\twhen_are_you_planning_to_make_a_purchase?\tfull_name\tphone_number\tphone_number_verified
ig\tbuy\t90_lakhs-1_cr\twithin_3_months\tMukur Desai\tp:+917990051179\tTRUE
ig\tbuy\tjust_exploring\twithin_3_months\tRuchit Shah\tp:+917069268532\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tUrvish Parekh\tp:+919724807095\tTRUE
ig\tbuy\t90_lakhs-1_cr\twithin_3_months\tJignesh Shah\tp:+919426349643\tFALSE
ig\tbuy\t84-90_lakhs.\t3-6_months\tRutvik Bhaskar\tp:+919913130777\tFALSE
fb\tinvest\t90_lakhs-1_cr\t3-6_months\tBhatt Payal\tp:+919624598006\tTRUE
ig\tbuy\t90_lakhs-1_cr\t3-6_months\tmahesh shah\tp:+919106223121\tTRUE
ig\tjust_exploring\t84-90_lakhs.\tjust_exploring\tAnil Kumar\tp:+917600905889\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tVarun Davda\tp:+918530978753\tTRUE
ig\tbuy\t84-90_lakhs.\t3-6_months\tAnkit Trivedi\tp:+919833248479\tFALSE
fb\tbuy\t84-90_lakhs.\t3-6_months\tYogesh Solanki\tp:+918401976633\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tUtsavjain\tp:+918850930433\tFALSE
ig\tbuy\t84-90_lakhs.\t3-6_months\tUdit Panchal\tp:+919574993783\tTRUE
fb\tbuy\t90_lakhs-1_cr\t3-6_months\tAnjali Mehta\tp:+919979530520\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tDrishti jain\tp:+917424802245\tFALSE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tKaushal Shah\tp:+919879016022\tTRUE
fb\tbuy\tjust_exploring\twithin_3_months\tkirat shukla\tp:+919428410960\tTRUE
fb\tinvest\t84-90_lakhs.\tjust_exploring\tAakash vyas\tp:+917487930948\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tShivam shah\tp:+917046454615\tTRUE
ig\tinvest\t84-90_lakhs.\t3-6_months\tsuhani shah\tp:+919879539800\tTRUE
ig\tbuy\t84-90_lakhs.\t3-6_months\tPriyank Shah\tp:+917878904848\tTRUE
ig\tbuy\tjust_exploring\twithin_3_months\tGautam Lokwani\tp:+918460649287\tTRUE
ig\tbuy\t90_lakhs-1_cr\twithin_3_months\tManav Shah\tp:+918511362632\tFALSE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tisha soni\tp:+919825830303\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\t#!tu_m@l!_3134\tp:+917046873432\tFALSE
ig\tbuy\t84-90_lakhs.\t3-6_months\tDimple Nihir Desai\tp:+919426025495\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tAnkit\tp:+919016173451\tFALSE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tDharmesh Patel\tp:+919725695061\tTRUE
ig\tbuy\t90_lakhs-1_cr\twithin_3_months\tNilesh Shah\tp:+919825237473\tTRUE
ig\tbuy\t90_lakhs-1_cr\twithin_3_months\tCA Rishabh Soni\tp:+919426225406\tTRUE
ig\tbuy\t84-90_lakhs.\t3-6_months\tzainab attarwala\tp:+918511419353\tTRUE
fb\tbuy\t84-90_lakhs.\tjust_exploring\tPriyansh Shah\tp:+917600653048\tTRUE
ig\tbuy\t84-90_lakhs.\tjust_exploring\tHarsh Vaidya\tp:+918238140700\tTRUE
ig\tbuy\t84-90_lakhs.\t3-6_months\tShonali Chakraborty\tp:+919265100532\tTRUE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tYoges Sharma\tp:+919974355551\tTRUE
ig\tjust_exploring\t84-90_lakhs.\tjust_exploring\tRitesh Shah\tp:+918000756485\tFALSE
ig\tbuy\t84-90_lakhs.\tjust_exploring\tKhushi Panchal\tp:+918141905413\tFALSE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tBhavesh Thakkar\tp:+919925456070\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tMeet Rupera\tp:+918732925500\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tNeetu Shivkani\tp:+919624841779\tTRUE
fb\tbuy\t84-90_lakhs.\t3-6_months\tdip Shukla\tp:+919898213959\tTRUE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tmahesh\tp:+919427051633\tTRUE
fb\tinvest\t84-90_lakhs.\twithin_3_months\tSachin Bhow\tp:+919879786996\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tR@my@_$h@h\tp:+917041158980\tTRUE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tReena Panara\tp:+917698351588\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tHarshil\tp:+917600259680\tTRUE
fb\tbuy\tjust_exploring\twithin_3_months\tDevendra\tp:+916269921400\tTRUE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tSatish Trivedi\tp:+919924702401\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tHarshal\tp:+918866600686\tFALSE
fb\tinvest\t90_lakhs-1_cr\twithin_3_months\tVishal Shah\tp:+919428006593\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tJainam Shah\tp:+919428578618\tFALSE
ig\tbuy\t90_lakhs-1_cr\twithin_3_months\tShah Sakshi\tp:+919016170915\tTRUE
ig\tjust_exploring\t84-90_lakhs.\tjust_exploring\tTejas Mistry Rishi\tp:+919712380332\tFALSE
fb\tbuy\t84-90_lakhs.\t3-6_months\tDhwani Sarvang Shukla\tp:+918000474424\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tGaurav Soni\tp:+917405518776\tFALSE
ig\tbuy\t84-90_lakhs.\t3-6_months\tDOLLY\tp:+918690505717\tTRUE
ig\tbuy\t90_lakhs-1_cr\t3-6_months\tThread Sutra\tp:+919821777823\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tJapen Shah\tp:+919824874524\tTRUE
ig\tbuy\t84-90_lakhs.\t3-6_months\tDarshit Mehta\tp:+919408054274\tFALSE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tKhusha\tp:+919875118083\tTRUE
ig\tbuy\t84-90_lakhs.\t3-6_months\tHarsh Soni\tp:+919978843860\tTRUE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tdwiti talati\tp:+919879777119\tTRUE
ig\tbuy\t84-90_lakhs.\twithin_3_months\tKhushi Panchal\tp:+917878403562\tTRUE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tDarshan Thummar\tp:+918000446449\tTRUE
ig\tbuy\t90_lakhs-1_cr\twithin_3_months\tPurvil\tp:+918160186794\tTRUE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tNilesh Desai\tp:+919724330775\tTRUE
ig\tbuy\t90_lakhs-1_cr\t3-6_months\tMitesh Kothari\tp:+919825777873\tTRUE
fb\tbuy\t84-90_lakhs.\twithin_3_months\tGandhi Ashok\tp:+919316761196\tTRUE
ig\tbuy\t90_lakhs-1_cr\t3-6_months\tSandip Navinchandra Mota\tp:+917878757940\tFALSE
ig\tbuy\t84-90_lakhs.\tjust_exploring\tPriyanshi\tp:+918980054101\tTRUE`;

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function parsePhone(raw) {
  return raw.replace(/^p:\+91/, '').trim();
}

function parseBudget(raw) {
  const map = {
    '84-90_lakhs.':  8700000,
    '90_lakhs-1_cr': 9500000,
    'just_exploring': null,
  };
  return map[raw] ?? null;
}

function parseTimeline(raw) {
  const map = {
    'within_3_months': '0-15 days',
    '3-6_months':      '90+ days',
    'just_exploring':  null,
  };
  return map[raw] ?? null;
}

function parsePurpose(raw) {
  const map = {
    'buy':            'Personal Use',
    'invest':         'Investment',
    'just_exploring': null,
  };
  return map[raw] ?? null;
}

// ─── TSV parser ───────────────────────────────────────────────────────────────
function parseTSV(tsv) {
  const lines  = tsv.trim().split('\n');
  const header = lines[0].split('\t').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split('\t');
    return header.reduce((obj, key, i) => {
      obj[key] = (cols[i] ?? '').trim();
      return obj;
    }, {});
  });
}

// ─── Row → Lead document ──────────────────────────────────────────────────────
function rowToLead(row) {
  const intent   = row['are_you_looking_to_buy,_invest,_or_just_explore_options_righ'];
  const budget   = row['what_is_your_preferred_budget_range_for_your_new_home?'];
  const timeline = row['when_are_you_planning_to_make_a_purchase?'];
  const fullName = row['full_name'];
  const phone    = row['phone_number'];

  const doc = {
    leadType:        'Buyer',
    ref:             'FB-Ads-Scarlet',
    fullName:        fullName || undefined,
    phoneNumber:     parsePhone(phone),
    budget:          parseBudget(budget),
    purposeOfBuying: parsePurpose(intent),
    timelineToBuy:   parseTimeline(timeline),
    leadStatus:      'New',
    propertyType:    'Residential Sell',
  };

  // Remove null/undefined optional fields to avoid schema cast errors
  Object.keys(doc).forEach(k => {
    if (doc[k] === null || doc[k] === undefined) delete doc[k];
  });

  return doc;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const DRY_RUN   = process.env.DRY_RUN === 'true';
  const MONGO_URI = "mongodb+srv://foram:jkvGOirxpWtyU15a@crm.gbdokt6.mongodb.net/CRMRealEstate";

  if (!MONGO_URI) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  const rows  = parseTSV(RAW_TSV);
  const leads = rows.map(rowToLead);
  console.log(`\nParsed ${leads.length} rows from TSV.\n`);

  if (DRY_RUN) {
    console.log('DRY RUN — first 3 documents:\n');
    leads.slice(0, 3).forEach((l, i) => console.log(`[${i + 1}]`, JSON.stringify(l, null, 2)));
    console.log('\nDry run complete. No data written.');
    return;
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  const results = { inserted: 0, skipped: 0, errors: [] };

  for (const lead of leads) {
    try {
      await Lead.create(lead);
      results.inserted++;
      console.log(`  Imported : ${lead.fullName} (${lead.phoneNumber})`);
    } catch (err) {
      if (err.code === 11000) {
        results.skipped++;
        console.warn(`  SKIP duplicate phone: ${lead.phoneNumber} (${lead.fullName})`);
      } else {
        results.errors.push({ phone: lead.phoneNumber, message: err.message });
        console.error(`  ERROR ${lead.phoneNumber}: ${err.message}`);
      }
    }
  }

  console.log('\n─── Import summary ───────────────────────');
  console.log(`  Inserted : ${results.inserted}`);
  console.log(`  Skipped  : ${results.skipped}  (duplicate phone)`);
  console.log(`  Errors   : ${results.errors.length}`);
  if (results.errors.length) {
    console.log('\nError details:');
    results.errors.forEach(e => console.log(`  ${e.phone} → ${e.message}`));
  }
  console.log('──────────────────────────────────────────\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
