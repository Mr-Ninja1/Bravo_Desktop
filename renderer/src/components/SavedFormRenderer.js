import ProductRejectionPresentational from '../forms/components/ProductRejectionPresentational';
import ChilledFrozenReceivingPresentational from '../forms/components/ChilledFrozenReceivingPresentational';
import ChemicalsReceivingPresentational from '../forms/components/ChemicalsReceivingPresentational';
import DryGoodsReceivingPresentational from '../forms/components/DryGoodsReceivingPresentational';
import BinLinersChangingLogPresentational from '../forms/components/BinLinersChangingLogPresentational';
import BeverageReceivingPresentational from '../forms/components/BeverageReceivingPresentational';
import PackagingMaterialsReceivingPresentational from '../forms/components/PackagingMaterialsReceivingPresentational';
import VegetablesFruitsReceivingPresentational from '../forms/components/VegetablesFruitsReceivingPresentational';
import ToolboxTalkRegisterPresentational from '../forms/components/ToolboxTalkRegisterPresentational';
import WelfareFacilitiesPresentational from '../forms/components/WelfareFacilitiesPresentational';
import FoodHandlersDailyShoweringPresentational from '../forms/components/FoodHandlersDailyShoweringPresentational';
import FoodSamplesCollectionPresentational from '../forms/components/FoodSamplesCollectionPresentational';
import FruitWashingLogPresentational from '../forms/components/FruitWashingLogPresentational';
import PastInspectionFormPresentational from '../forms/components/PastInspectionFormPresentational';
import EggsReceivingPresentational from '../forms/components/EggsReceivingPresentational';
import CertificateOfAnalysisPresentational from '../forms/components/CertificateOfAnalysisPresentational';
import React from 'react';

// A4 width in pixels at 96dpi: ~794
const A4_WIDTH = 794;
import FoodHandlersPresentational from '../forms/components/FoodHandlersPresentational';
import ThawingTemperaturePresentational from '../forms/components/ThawingTemperaturePresentational';
import FOH_DailyCleaningPresentational from '../forms/components/FOH_DailyCleaningPresentational';
import FOH_FrontOfHouseCleaningPresentational from '../forms/components/FOH_FrontOfHouseCleaningPresentational';
import DisplayChillerShelfLifeInspectionPresentational from '../forms/components/DisplayChillerShelfLifeInspectionPresentational';
import BOH_ShelfLifeInspectionPresentational from '../forms/components/BOH_ShelfLifeInspectionPresentational';
import Bakery_UnderbarShelfLifeInspectionPresentational from '../forms/components/Bakery_UnderbarShelfLifeInspectionPresentational';
import PreShiftMeetingAttendancePresentational from '../forms/components/PreShiftMeetingAttendancePresentational';
import TrainingAttendanceRegisterPresentational from '../forms/components/TrainingAttendanceRegisterPresentational';
import ProcessQualityOutOfControlPresentational from '../forms/components/ProcessQualityOutOfControlPresentational';
import ProductReleasePresentational from '../forms/components/ProductReleasePresentational';
import CustomerSatisfactionPresentational from '../forms/components/CustomerSatisfactionPresentational';
import CustomerSatisfactionQuestionnairePresentational from '../forms/components/CustomerSatisfactionQuestionnairePresentational';
import BakerySanitizingPresentational from '../forms/components/BakerySanitizingPresentational';
import MouldingProofingBakingLogPresentational from '../forms/components/MouldingProofingBakingLogPresentational';
import BakeryCleaningChecklistPresentational from '../forms/components/BakeryCleaningChecklistPresentational';
import BakingControlSheetPresentational from '../forms/components/BakingControlSheetPresentational';
import MixingControlSheetPresentational from '../forms/components/MixingControlSheetPresentational';
import ProductsNetContentChecklistPresentational from '../forms/components/ProductsNetContentChecklistPresentational';
import PPEIssuancePresentational from '../forms/components/PPEIssuancePresentational';
import KitchenWeeklyCleaningChecklistPresentational from '../forms/components/KitchenWeeklyCleaningChecklistPresentational';
import KitchenDailyCleaningPresentational from '../forms/components/KitchenDailyCleaningPresentational';
import UnderbarChillerTemperaturePresentational from '../forms/components/UnderbarChillerTemperaturePresentational';
import HotHoldingTemperaturePresentational from '../forms/components/HotHoldingTemperaturePresentational';
import CookingTemperaturePresentational from '../forms/components/CookingTemperaturePresentational';
import CoolingTemperaturePresentational from '../forms/components/CoolingTemperaturePresentational';
import CoolingTemperatureSavedPresentational from '../forms/components/CoolingTemperatureSavedPresentational';
import DeepFreezerTemperaturePresentational from '../forms/components/DeepFreezerTemperaturePresentational';
import DisplayChillerTemperaturePresentational from '../forms/components/DisplayChillerTemperaturePresentational';
import DryStorageArea_CleaningChecklistPresentational from '../forms/components/DryStorageArea_CleaningChecklistPresentational';
import SculleryArea_CleaningChecklistPresentational from '../forms/components/SculleryArea_CleaningChecklistPresentational';
import ColdRoom_FreezerRoomCleaningChecklistPresentational from '../forms/components/ColdRoom_FreezerRoomCleaningChecklistPresentational';
import WalkInChillerLogPresentational from '../forms/components/WalkInChillerLogPresentational';
import WalkInFreezerLogPresentational from '../forms/components/WalkInFreezerLogPresentational';
import CleaningEquipment_CleaningChecklistPresentational from '../forms/components/CleaningEquipment_CleaningChecklistPresentational';
import { View, Text, StyleSheet } from 'react-native';
import VisitorsLogBookPresentational from '../forms/components/VisitorsLogBookPresentational';
import PersonalHygieneChecklistPresentational from '../forms/components/PersonalHygieneChecklistPresentational';
import BravoHealthStatusCheckPresentational from '../forms/components/BravoHealthStatusCheckPresentational';
// Add other form imports as needed

// SavedFormRenderer renders a saved payload using the same form component (read-only)
export default function SavedFormRenderer({ savedPayload, embedded = false, exportingWide = false }) {
  if (!savedPayload) return null;
  // The Saved Forms history entries sometimes wrap the payload in different shapes
  // or may be stored as JSON strings. Defensively parse stringified payloads so
  // presentational components always receive an object the same way mobile does.
  const parseMaybeJson = (v) => {
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch (e) { return v; }
    }
    return v;
  };

  let payload = null;
  try {
    const sp = parseMaybeJson(savedPayload);
    const meta = (sp && typeof sp === 'object') ? (sp.meta || null) : null;
    // Prefer canonical nested payloads when present
    if (sp && sp.payload) payload = parseMaybeJson(sp.payload);
    else if (meta && meta.payload) payload = parseMaybeJson(meta.payload);
    else if (meta) payload = parseMaybeJson(meta);
    else payload = parseMaybeJson(sp);

    if (typeof payload !== 'object' || payload === null) payload = { title: String(payload) };
  } catch (e) {
    payload = (typeof savedPayload === 'object' && savedPayload) ? savedPayload : { title: String(savedPayload) };
  }

  // Detect common form types and render the appropriate presentational component
  // include history entry top-level title as a fallback when payload lacks title
  const type = (payload?.formType || payload?.formTypeName || payload?.title || savedPayload?.title || '').toString();

  try {
    // lightweight debug to help identify why some forms render blank
    // eslint-disable-next-line no-console
    console.debug('SavedFormRenderer: detected type ->', type, 'payloadKeys ->', Object.keys(payload || {}).slice(0,30));
  } catch (e) { }

  // Helper for export-wide style
  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  // Chilled & Frozen Receiving
  if (/ChilledFrozenReceivingForm|Chilled & Frozen Receiving|ChilledFrozenReceiving/i.test(type)) {
    return <View style={exportA4Style}><ChilledFrozenReceivingPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }

  // Dry Goods Receiving
  if (/DryGoodsReceivingForm|Dry Goods Receiving|DryGoodsReceiving/i.test(type)) {
    return <View style={exportA4Style}><DryGoodsReceivingPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }

  // Chemicals Receiving
  if (/ChemicalsReceivingForm|Chemicals Receiving|ChemicalsReceiving/i.test(type)) {
    return <View style={exportA4Style}><ChemicalsReceivingPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }

  // Food Handlers
  const looksLikeFoodHandlers = Array.isArray(payload?.handlers) && Array.isArray(payload?.timeSlots);
  if (looksLikeFoodHandlers || /handwash/i.test(type)) {
    return (
      <View style={exportA4Style}>
        <FoodHandlersPresentational payload={payload} exportingWide={exportingWide} />
      </View>
    );
  }

  // FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH
  // Accept variants like "FOH — PM", "FOH - PM", or titles that mention 'sanitiz' and 'FOH'
  if (/FOH_DailyCleaning|FOH_FrontOfHouseCleaning|FRONT OF HOUSE|\bFOH\b|FOOD CONTACT SURFACE.*SANITIZ|SANITIZING.*FOH|FOOD CONTACT SURFACE.*FOH/i.test(type)) {
    return (
      <View style={exportA4Style}>
        {/* Prefer the specific front-of-house renderer when type matches */}
        { /FOH_FrontOfHouseCleaning|FRONT OF HOUSE/i.test(type) ? (
          <FOH_FrontOfHouseCleaningPresentational payload={payload} exportingWide={exportingWide} />
        ) : (
          <FOH_DailyCleaningPresentational payload={payload} exportingWide={exportingWide} />
        )}
      </View>
    );
  }

  // Display Chiller Shelf-Life (narrow match to shelf-life variants only)
  if (/DisplayChillerShelfLifeInspection|DisplayChillerShelfLife|SHELF[- ]?LIFE|Shelf[- ]?Life|DISPLAY CHILLER SHELF[- ]?LIFE/i.test(type)) {
    return (
      <View style={exportA4Style}>
        <DisplayChillerShelfLifeInspectionPresentational payload={payload} exportingWide={exportingWide} />
      </View>
    );
  }
  // BOH Products Shelf-Life
  if (/BOH_ShelfLifeInspectionChecklist|BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST|BOH Products Shelf-Life/i.test(type)) {
    return (
      <View style={exportA4Style}>
        <BOH_ShelfLifeInspectionPresentational payload={payload} exportingWide={exportingWide} />
      </View>
    );
  }
  // Bakery Underbar Shelf-Life
  if (/Bakery_UnderbarShelfLifeInspectionChecklist|UNDERBAR CHILLER SHELF-LIFE INSPECTION CHECKLIST|Underbar Chiller Shelf-Life/i.test(type)) {
    return (
      <View style={exportA4Style}>
        <Bakery_UnderbarShelfLifeInspectionPresentational payload={payload} exportingWide={exportingWide} />
      </View>
    );
  }
  // Bin Liners Changing Log
  if (/BinLinersChangingLog|Bin Liners Changing Log/i.test(type)) {
    return <View style={exportA4Style}><BinLinersChangingLogPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Beverage & Water Receiving
  if (/BeverageReceivingForm|Beverage & Water Receiving|Beverage and Water Receiving/i.test(type)) {
    return <View style={exportA4Style}><BeverageReceivingPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Product Rejection Form
  if (/ProductRejectionForm/i.test(type)) {
    return <View style={exportA4Style}><ProductRejectionPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Packaging Materials Receiving
  if (/PackagingMaterialsReceivingForm|Packaging Materials Receiving|PackagingMaterialsReceiving/i.test(type)) {
    return <View style={exportA4Style}><PackagingMaterialsReceivingPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Process & Quality Out of Control Report
  if (/ProcessQualityOutOfControlReport|Process & Quality Out of Control|Out of Control/i.test(type)) {
    return <View style={exportA4Style}><ProcessQualityOutOfControlPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Product Release Form
  if (/ProductReleaseForm|Product Release/i.test(type)) {
    return <View style={exportA4Style}><ProductReleasePresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Customer Satisfaction Questionnaire
  if (/CustomerSatisfactionQuestionnaire|Customer Satisfaction|CustomerSatisfaction/i.test(type)) {
    return <View style={exportA4Style}><CustomerSatisfactionQuestionnairePresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Vegetables & Fruits Receiving
  if (/VegetablesFruitsReceiving|Vegetables and Fruits Receiving|VegetablesFruitsReceivingForm/i.test(type)) {
    return <View style={exportA4Style}><VegetablesFruitsReceivingPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Eggs Receiving
  if (/EggsReceiving|Eggs Receiving|EggsReceivingForm/i.test(type)) {
    return <View style={exportA4Style}><EggsReceivingPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Certificate of Analysis
  if (/CertificateOfAnalysis|Certificate of Analysis|CertificateOfAnalysisForm/i.test(type)) {
    return <View style={exportA4Style}><CertificateOfAnalysisPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Toolbox Talk Register
  if (/ToolboxTalkRegister|Tool Box Talk Register|TBT Register/i.test(type)) {
    return <View style={exportA4Style}><ToolboxTalkRegisterPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Welfare Facilities Cleaning Checklist
  if (/WelfareFacilities_CleaningChecklist|Welfare Facilities Cleaning Checklist|Welfare Facilities/i.test(type)) {
    return <View style={exportA4Style}><WelfareFacilitiesPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }

  // Cleaning Equipment Checklist
  if (/CleaningEquipment_CleaningChecklist|Cleaning Equipment Checklist|CLEANING EQUIPMENT CHECKLIST/i.test(type)) {
    return <View style={exportA4Style}><CleaningEquipment_CleaningChecklistPresentational payload={payload} exportingWide={exportingWide} /></View>;
  }
  // Food Handlers Daily Showering Log (reuse if type matches)
  if (/FoodHandlersDailyShowering|Daily Showering|FOOD HANDLERS DAILY SHOWERING/i.test(type)) {
    return <FoodHandlersDailyShoweringPresentational payload={payload} />;
  }
  // Food Samples Collection Log
  if (/FoodSamplesCollectionLog|Food Samples Collection/i.test(type)) {
    return <FoodSamplesCollectionPresentational payload={payload} />;
  }
  // Fruit, Vegetable & Egg Washing Log
  if (/FruitWashingLog|Fruit, Vegetable and Egg Washing|Fruit Washing/i.test(type)) {
    return <FruitWashingLogPresentational payload={payload} />;
  }

  // Bakery forms
  if (/Bakery_SanitizingLog|Sanitizing Log|Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery/i.test(type)) {
    return <BakerySanitizingPresentational payload={payload} embedded={embedded} />;
  }
  if (/MouldingProofingBakingLog|MOULDING PROOFING AND BAKING LOG SHEET/i.test(type)) {
    return <MouldingProofingBakingLogPresentational payload={payload} />;
  }
  if (/Bakery_CleaningChecklist|Bakery Area Cleaning Checklist|BAKERY AREA CLEANING CHECKLIST|BakeryCleaningChecklist/i.test(type)) {
    return <BakeryCleaningChecklistPresentational payload={payload} />;
  }

  // Fallback detection: some saved entries may not include the exact formType/title
  // but will contain a formData array where each item has a `days` map (Sun..Sat).
  // Detect that shape and render the bakery cleaning presentational.
  // Ensure explicit Kitchen Weekly forms are handled before shape-based fallbacks
  if (/KitchenWeeklyCleaningChecklist|Kitchen Weekly Cleaning Checklist|Kitchen_WeeklyCleaningChecklist/i.test(type)) {
    return <KitchenWeeklyCleaningChecklistPresentational payload={payload} />;
  }

  // Ensure explicit Kitchen Daily (sanitizing) forms are handled before shape-based fallbacks
  if (/Kitchen Daily Cleaning|Kitchen_DailyCleaningForm|Kitchen Daily Cleaning & Sanitizing|Food Contact Surface Cleaning and Sanitizing Log Sheet \(Kitchen\)/i.test(type)) {
    return <KitchenDailyCleaningPresentational payload={payload} />;
  }

  try {
    const first = Array.isArray(payload?.formData) && payload.formData.length ? payload.formData[0] : null;
    // Cold Room shape detection: rows contain a `checks` object keyed by days (Sun..Sat)
    // Accept both 'Thu' and 'Thurs' variants for Thursday since some forms use 'Thurs'.
    const looksLikeColdRoom = first && typeof first === 'object' && first.checks && typeof first.checks === 'object' && (
      ['Sun','Mon','Tue','Wed','Fri','Sat'].every(d => Object.prototype.hasOwnProperty.call(first.checks, d)) &&
      (Object.prototype.hasOwnProperty.call(first.checks, 'Thu') || Object.prototype.hasOwnProperty.call(first.checks, 'Thurs'))
    );
    if (looksLikeColdRoom || /ColdRoom|Cold Room|Freezer Room/i.test(type)) {
      return <ColdRoom_FreezerRoomCleaningChecklistPresentational payload={payload} />;
    }
    const hasDaysMap = first && typeof first.days === 'object' && first.days !== null && ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].every(d => Object.prototype.hasOwnProperty.call(first.days, d));
    if (hasDaysMap || /\bbakery\b/i.test(type)) {
      return <BakeryCleaningChecklistPresentational payload={payload} />;
    }
    // Mixing Control Sheet shape detection: some history entries may not include
    // the canonical formType/title but will include formData rows with mixing fields.
    const looksLikeMixing = first && typeof first === 'object' && (
      Object.prototype.hasOwnProperty.call(first, 'prodDate') &&
      Object.prototype.hasOwnProperty.call(first, 'prodName') &&
      Object.prototype.hasOwnProperty.call(first, 'batchNo') &&
      Object.prototype.hasOwnProperty.call(first, 'ingredients')
    );
    if (looksLikeMixing || /MixingControlSheet|Mixing Control Sheet/i.test(type)) {
      return <MixingControlSheetPresentational payload={payload} />;
    }
    // Bakery Sanitizing Log detection: rows have name, ppm and a `times` map (e.g. '06:00AM': true)
    const looksLikeBakerySanitizing = first && typeof first === 'object' && (
      Object.prototype.hasOwnProperty.call(first, 'name') &&
      Object.prototype.hasOwnProperty.call(first, 'ppm') &&
      Object.prototype.hasOwnProperty.call(first, 'times')
    );
    if (looksLikeBakerySanitizing || /Bakery_SanitizingLog|Sanitizing Log|Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery/i.test(type)) {
      // If the canonical timeSlots/header info is missing, infer from the first row's times keys
      try {
        if ((!payload.timeSlots || !payload.timeSlots.length) && first && first.times && typeof first.times === 'object') {
          payload.timeSlots = Object.keys(first.times);
        }
      } catch (e) {
        // ignore inference errors
      }
      return <BakerySanitizingPresentational payload={payload} embedded={embedded} />;
    }
    // Products Net Content Checklist detection: shape-based fallback for history entries
    const looksLikeProductsNet = first && typeof first === 'object' && (
      Object.prototype.hasOwnProperty.call(first, 'name') &&
      Object.prototype.hasOwnProperty.call(first, 'expectedWeight')
    );
    if (looksLikeProductsNet || /ProductsNetContentChecklist|Products Net Content Checklist/i.test(type) || (payload?.metadata?.subject && /PRODUCTS NET CONTENT CHECKLIST/i.test(payload.metadata.subject))) {
      return <ProductsNetContentChecklistPresentational payload={payload} />;
    }

    // Personal  Protective Equipment Log detection: rows contain many PPE boolean fields like 'apron', 'cap', 'chefHat'
    const looksLikePPE = first && typeof first === 'object' && (
      Object.prototype.hasOwnProperty.call(first, 'apron') &&
      Object.prototype.hasOwnProperty.call(first, 'cap') &&
      Object.prototype.hasOwnProperty.call(first, 'chefHat')
    );
    if (looksLikePPE || /PPEIssuance|Personal Protective Equipment|Personal  Protective Equipment Log/i.test(type)) {
      return <PPEIssuancePresentational payload={payload} />;
    }
    // Visitors Log Book detection (shape-based): rows contain visitor fields like name/address/contact/purpose
    const looksLikeVisitors = first && typeof first === 'object' && (
      Object.prototype.hasOwnProperty.call(first, 'name') &&
      Object.prototype.hasOwnProperty.call(first, 'address') &&
      Object.prototype.hasOwnProperty.call(first, 'contact') &&
      Object.prototype.hasOwnProperty.call(first, 'purpose')
    );
    if (looksLikeVisitors || /Visitors Log Book|VisitorsLogBook|VISITORS LOG BOOK/i.test(type)) {
      return <VisitorsLogBookPresentational payload={payload} embedded={embedded} />;
    }
  } catch (e) {
    // ignore shape detection errors and continue to other matchers
  }
  // Kitchen Weekly Cleaning
  // (Handled earlier to avoid shape-based mis-detection)
  // Dry Storage Area Cleaning
  if (/DryStorageArea_CleaningChecklist|Dry Storage Area Cleaning Checklist|DRY STORAGE AREA CLEANING CHECKLIST/i.test(type)) {
    return <DryStorageArea_CleaningChecklistPresentational payload={payload} />;
  }
  // Scullery Area Cleaning
  if (/SculleryArea_CleaningChecklist|Scullery Area Cleaning Checklist|SCULLERY AREA CLEANING CHECKLIST/i.test(type)) {
    return <SculleryArea_CleaningChecklistPresentational payload={payload} />;
  }
  // Cold Room / Freezer Room Cleaning (support variants with '/', '&' or no separator)
  if (/ColdRoom_FreezerRoomCleaningChecklist|Cold\s*Room[\s\/&]+Freezer\s*Room\s*Cleaning\s*Checklist|COLD\s*ROOM[\s\/&]+FREEZER\s*ROOM\s*CLEANING\s*CHECKLIST/i.test(type)) {
    return <ColdRoom_FreezerRoomCleaningChecklistPresentational payload={payload} />;
  }
  // Kitchen Daily Cleaning
  if (/Kitchen Daily Cleaning|Kitchen_DailyCleaningForm|Kitchen Daily Cleaning & Sanitizing/i.test(type)) {
    return <KitchenDailyCleaningPresentational payload={payload} />;
  }
  // Underbar chiller
  if (/Underbar Chiller Temperature Log|UnderbarChillerTemperatureLog/i.test(type)) {
    return <UnderbarChillerTemperaturePresentational payload={payload} />;
  }
  // Display Chiller Temperature Log (any of the variants including 'Grab and Go')
  if (/DisplayChillerTemperatureLog|DISPLAY CHILLER TEMPERATURE LOG SHEET|Display Chiller Temperature Log|Grab\s*and\s*Go|GrabAndGo/i.test(type)) {
    return <DisplayChillerTemperaturePresentational payload={payload} />;
  }
  // Deep Freezer Temp Log
  if (/Deep Freezer Temperature Log|DeepFreezerTemperatureLog|Deep Freezer/i.test(type)) {
    return <DeepFreezerTemperaturePresentational payload={payload} />;
  }
  // Cooking Temp
  if (/Cooking Temperature Log|CookingTemperatureLog|COOKING TEMPERATURE LOG/i.test(type)) {
    return <CookingTemperaturePresentational payload={payload} />;
  }
  // Cooling Temp (saved view uses the read-only presentational)
  if (/Cooling Temperature Log|CoolingTemperatureLog/i.test(type)) {
    return <CoolingTemperatureSavedPresentational payload={payload} />;
  }
  // Hot Holding Temp
  if (/Hot Holding Temperature Log|HotHoldingTemperatureLog|Hot Holding Temp Log/i.test(type)) {
    return <HotHoldingTemperaturePresentational payload={payload} />;
  }
  // Thawing Temp
  if (/Thawing Temperature Log|ThawingTemperatureLog|Thawing/i.test(type)) {
    return <ThawingTemperaturePresentational payload={payload} />;
  }
  // Visitors Log Book
  if (/Visitors Log Book|VisitorsLogBook|VISITORS LOG BOOK/i.test(type) || /VisitorsLogBook/i.test(type)) {
    return <VisitorsLogBookPresentational payload={payload} embedded={embedded} />;
  }
  // Bravo Health Status Check
  if (/BravoHealthStatusCheck|BRAVO BRANDS HEALTH STATUS CHECK|Health Status Check|Bravo Brands Health/i.test(type)) {
    return <BravoHealthStatusCheckPresentational payload={payload} />;
  }
  // Walk-in chiller saved view
  if (/WalkInChillerLog|WALK-IN CHILLER TEMPERATURE CHECKLIST|Walk-In Chiller|WalkInChiller/i.test(type)) {
    return <WalkInChillerLogPresentational payload={payload} />;
  }
  // Walk-in freezer saved view
  if (/WalkInFreezerLog|WALK-IN FREEZER TEMPERATURE CHECKLIST|Walk-In Freezer|WalkInFreezer/i.test(type)) {
    return <WalkInFreezerLogPresentational payload={payload} />;
  }
  // Personal Hygiene Checklist
  if (/PersonalHygieneChecklist|Personal Hygiene Checklist|Personnel Hygiene Checklist/i.test(type) || /PersonalHygieneChecklist/i.test(type)) {
    return <PersonalHygieneChecklistPresentational payload={payload} embedded={embedded} />;
  }
  // Mixing Control Sheet
  if (/MixingControlSheet|Mixing Control Sheet|MIXING CONTROL SHEET/i.test(type)) {
    return <MixingControlSheetPresentational payload={payload} />;
  }
  // Baking Control Sheet
  if (/BakingControlSheet|Baking Control Sheet|BAKING CONTROL SHEET/i.test(type)) {
    return <BakingControlSheetPresentational payload={payload} />;
  }
  // Products Net Content Checklist
  if (/ProductsNetContentChecklist|Products Net Content Checklist|PRODUCTS NET CONTENT CHECKLIST/i.test(type)) {
    return <ProductsNetContentChecklistPresentational payload={payload} />;
  }
  // Past Inspection / Pest Inspection Form
  if (/PastInspectionForm|Pest Inspection Form|PestInspection/i.test(type)) {
    return <PastInspectionFormPresentational payload={payload} />;
  }
  // Pre Shift Meeting Attendance
  if (/PreShiftMeetingAttendance/i.test(type)) {
    return <PreShiftMeetingAttendancePresentational payload={payload} />;
  }
  // Training Attendance Register
  if (/TrainingAttendanceRegister|Training Attendance Register/i.test(type)) {
    return <TrainingAttendanceRegisterPresentational payload={payload} />;
  }
  // For all other forms, show a minimal message
  const safeRender = (Comp, props = {}) => {
    try {
      if (!Comp) {
        console.warn('SavedFormRenderer: component is undefined for props', props);
        return (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#b00', fontWeight: '700' }}>Form renderer unavailable</Text>
            <Text style={{ marginTop: 6 }}>This form type is not supported by the current build.</Text>
          </View>
        );
      }
      // Accept function/class components or forwardRef objects (check for $$typeof)
      const isFn = typeof Comp === 'function';
      const isObj = typeof Comp === 'object' && Comp !== null && (Comp.$$typeof || Comp.render);
      if (isFn || isObj) {
        return <Comp {...props} />;
      }
      console.warn('SavedFormRenderer: invalid component type', Comp);
      return (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#b00', fontWeight: '700' }}>Form renderer error</Text>
          <Text style={{ marginTop: 6 }}>Unable to render this saved form — component import is invalid.</Text>
        </View>
      );
    } catch (err) {
      console.warn('SavedFormRenderer: render error', err);
      return (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#b00', fontWeight: '700' }}>Form renderer crashed</Text>
          <Text style={{ marginTop: 6 }}>{String(err)}</Text>
        </View>
      );
    }
  };

  // Fallback message: include lightweight debug info so developers can see the
  // detected "type" string and a preview of the payload keys / first row.
  return safeRender(View, { style: { padding: 24 }, children: (
    <>
      <Text style={{ color: '#b00', fontWeight: 'bold', fontSize: 16 }}>Unsupported saved form type.</Text>
      <Text style={{ marginTop: 8, color: '#444' }}>This saved form does not match the Food Handlers layout. Please update the app to support this form type.</Text>
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '700' }}>Detected type:</Text>
        <Text>{type}</Text>
        <Text style={{ fontWeight: '700', marginTop: 8 }}>Payload keys:</Text>
        <Text>{Object.keys(payload || {}).join(', ')}</Text>
        <Text style={{ fontWeight: '700', marginTop: 8 }}>First row sample:</Text>
        <Text>{JSON.stringify(Array.isArray(payload?.formData) && payload.formData.length ? payload.formData[0] : null)}</Text>
      </View>
    </>
  ) });
}
