import BakeryCleaningChecklistPresentational from './BakeryCleaningChecklistPresentational';
import BakerySanitizingPresentational from './BakerySanitizingPresentational';
import BakingControlSheetPresentational from './BakingControlSheetPresentational';
import BeverageReceivingPresentational from './BeverageReceivingPresentational';
import BinLinersChangingLogPresentational from './BinLinersChangingLogPresentational';
import BOH_ShelfLifeInspectionPresentational from './BOH_ShelfLifeInspectionPresentational';
import BravoHealthStatusCheckPresentational from './BravoHealthStatusCheckPresentational';
import CertificateOfAnalysisPresentational from './CertificateOfAnalysisPresentational';
import ChemicalsReceivingPresentational from './ChemicalsReceivingPresentational';
import ChilledFrozenReceivingPresentational from './ChilledFrozenReceivingPresentational';
import CleaningEquipment_CleaningChecklistPresentational from './CleaningEquipment_CleaningChecklistPresentational';
import ColdRoom_FreezerRoomCleaningChecklistPresentational from './ColdRoom_FreezerRoomCleaningChecklistPresentational';
import CookingTemperaturePresentational from './CookingTemperaturePresentational';
import CoolingTemperaturePresentational from './CoolingTemperatureSavedPresentational';
import CustomerSatisfactionPresentational from './CustomerSatisfactionPresentational';
import CustomerSatisfactionQuestionnairePresentational from './CustomerSatisfactionQuestionnairePresentational';
import DisplayChillerShelfLifeInspectionPresentational from './DisplayChillerShelfLifeInspectionPresentational';
import DisplayChillerTemperaturePresentational from './DisplayChillerTemperaturePresentational';
import DryGoodsReceivingPresentational from './DryGoodsReceivingPresentational';
import DryStorageArea_CleaningChecklistPresentational from './DryStorageArea_CleaningChecklistPresentational';
import EggsReceivingPresentational from './EggsReceivingPresentational';
import FOH_DailyCleaningPresentational from './FOH_DailyCleaningPresentational';
import FOH_FrontOfHouseCleaningPresentational from './FOH_FrontOfHouseCleaningPresentational';
import FoodSamplesCollectionPresentational from './FoodSamplesCollectionPresentational';
import FruitWashingLogPresentational from './FruitWashingLogPresentational';
import HotHoldingTemperaturePresentational from './HotHoldingTemperaturePresentational';
import KitchenDailyCleaningPresentational from './KitchenDailyCleaningPresentational';
import KitchenWeeklyCleaningChecklistPresentational from './KitchenWeeklyCleaningChecklistPresentational';
import MixingControlSheetPresentational from './MixingControlSheetPresentational';
import MouldingProofingBakingLogPresentational from './MouldingProofingBakingLogPresentational';
import PackagingMaterialsReceivingPresentational from './PackagingMaterialsReceivingPresentational';
import PastInspectionFormPresentational from './PastInspectionFormPresentational';
import PPEIssuancePresentational from './PPEIssuancePresentational';
import ProcessQualityOutOfControlPresentational from './ProcessQualityOutOfControlPresentational';
import ProductReleasePresentational from './ProductReleasePresentational';
import ProductsNetContentChecklistPresentational from './ProductsNetContentChecklistPresentational';
import ThawingTemperaturePresentational from './ThawingTemperaturePresentational';
import WalkInChillerLogPresentational from './WalkInChillerLogPresentational';
import WalkInFreezerLogPresentational from './WalkInFreezerLogPresentational';
import WelfareFacilitiesPresentational from './WelfareFacilitiesPresentational';

const normalize = (s = '') => (s || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const map = {
  [normalize('Bakery_CleaningChecklist')]: BakeryCleaningChecklistPresentational,
  [normalize('BakerySanitizing')]: BakerySanitizingPresentational,
  [normalize('BakingControlSheet')]: BakingControlSheetPresentational,
  [normalize('BeverageReceivingForm')]: BeverageReceivingPresentational,
  [normalize('BinLinersChangingLog')]: BinLinersChangingLogPresentational,
  [normalize('BOH_ShelfLifeInspectionChecklist')]: BOH_ShelfLifeInspectionPresentational,
  [normalize('BravoHealthStatusCheck')]: BravoHealthStatusCheckPresentational,
  [normalize('CertificateOfAnalysis')]: CertificateOfAnalysisPresentational,
  [normalize('ChemicalsReceivingForm')]: ChemicalsReceivingPresentational,
  [normalize('ChilledFrozenReceivingForm')]: ChilledFrozenReceivingPresentational,
  [normalize('CleaningEquipment_CleaningChecklist')]: CleaningEquipment_CleaningChecklistPresentational,
  [normalize('ColdRoom_FreezerRoomCleaningChecklist')]: ColdRoom_FreezerRoomCleaningChecklistPresentational,
  [normalize('CookingTemperature')]: CookingTemperaturePresentational,
  [normalize('CoolingTemperature')]: CoolingTemperaturePresentational,
  [normalize('CustomerSatisfactionQuestionnaire')]: CustomerSatisfactionQuestionnairePresentational,
  [normalize('DisplayChillerShelfLifeInspectionChecklist')]: DisplayChillerShelfLifeInspectionPresentational,
  [normalize('DisplayChillerTemperature')]: DisplayChillerTemperaturePresentational,
  [normalize('DryGoodsReceivingForm')]: DryGoodsReceivingPresentational,
  [normalize('DryStorageArea_CleaningChecklist')]: DryStorageArea_CleaningChecklistPresentational,
  [normalize('EggsReceivingForm')]: EggsReceivingPresentational,
  [normalize('FOH_DailyCleaningForm')]: FOH_DailyCleaningPresentational,
  [normalize('FOH_FrontOfHouseCleaningChecklist')]: FOH_FrontOfHouseCleaningPresentational,
  [normalize('FoodSamplesCollectionLog')]: FoodSamplesCollectionPresentational,
  [normalize('FruitWashingLog')]: FruitWashingLogPresentational,
  [normalize('HotHoldingTemperature')]: HotHoldingTemperaturePresentational,
  [normalize('Kitchen_DailyCleaningForm')]: KitchenDailyCleaningPresentational,
  [normalize('Kitchen_WeeklyCleaningChecklist')]: KitchenWeeklyCleaningChecklistPresentational,
  [normalize('MixingControlSheet')]: MixingControlSheetPresentational,
  [normalize('MouldingProofingBakingLog')]: MouldingProofingBakingLogPresentational,
  [normalize('PackagingMaterialsReceivingForm')]: PackagingMaterialsReceivingPresentational,
  [normalize('PastInspectionForm')]: PastInspectionFormPresentational,
  [normalize('PPEIssuance')]: PPEIssuancePresentational,
  [normalize('ProcessQualityOutOfControl')]: ProcessQualityOutOfControlPresentational,
  [normalize('ProductRelease')]: ProductReleasePresentational,
  [normalize('ProductsNetContentChecklist')]: ProductsNetContentChecklistPresentational,
  [normalize('ThawingTemperature')]: ThawingTemperaturePresentational,
  [normalize('WalkInChillerLog')]: WalkInChillerLogPresentational,
  [normalize('WalkInFreezerLog')]: WalkInFreezerLogPresentational,
  [normalize('WelfareFacilities')]: WelfareFacilitiesPresentational,
};

export default { normalize, map };
