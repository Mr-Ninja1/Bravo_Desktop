

-  BOH_ShelfLifeInspectionPresentational.js
-  BravoHealthStatusCheckPresentational.js
-  CertificateOfAnalysisPresentational.js
-  ChemicalsReceivingPresentational.js
-  ChilledFrozenReceivingPresentational.js
-  CleaningEquipment_CleaningChecklistPresentational.js
-  ColdRoom_FreezerRoomCleaningChecklistPresentational.js
-  CoolingTemperatureSavedPresentational.js
-  CustomerSatisfactionPresentational.js
-  CustomerSatisfactionQuestionnairePresentational.js
-  DisplayChillerShelfLifeInspectionPresentational.js
-  DryGoodsReceivingPresentational.js
-  DryStorageArea_CleaningChecklistPresentational.js
-  EggsReceivingPresentational.js
-  FOH_DailyCleaningPresentational.js
-  FOH_FrontOfHouseCleaningPresentational.js
-  FoodHandlersDailyShoweringPresentational.js
-  FoodHandlersPresentational.js
-  FoodSamplesCollectionPresentational.js
-  PackagingMaterialsReceivingPresentational.js
-  PastInspectionFormPresentational.js
-  PersonalHygieneChecklistPresentational.js
-  PreShiftMeetingAttendancePresentational.js
-  ProcessQualityOutOfControlPresentational.js
-  ProductRejectionPresentational.js
-  ProductReleasePresentational.js
-  SculleryArea_CleaningChecklistPresentational.js
-  ThawingTemperaturePresentational.js
-  ToolboxTalkRegisterPresentational.js
-  TrainingAttendanceRegisterPresentational.js
-  VegetablesFruitsReceivingPresentational.js
-  WalkInChillerLogPresentational.js
-  WalkInFreezerLogPresentational.js



node -e "const fs=require('fs');const path=require('path');const presDir=path.join(__dirname,'renderer','src','forms','components');const expDir=path.join(__dirname,'src','exporters','html');const pres=fs.readdirSync(presDir).filter(f=>f.endsWith('Presentational.js')).map(f=>f.replace(/Presentational\.js$/,'').replace(/[^a-z0-9]/gi,'').toLowerCase());const exps=fs.readdirSync(expDir).filter(f=>f.toLowerCase().endsWith('.js')).map(f=>f.replace(/^generate/i,'').replace(/html\.js$/i,'').replace(/\.js$/i,'').replace(/[^a-z0-9]/gi,'').toLowerCase());const missing=fs.readdirSync(path.join(__dirname,'renderer','src','forms','components')).filter(f=>f.endsWith('Presentational.js')).map(f=>({file:f,key:f.replace(/Presentational\.js$/,'').replace(/[^a-z0-9]/gi,'').toLowerCase()})).filter(p=>!exps.includes(p.key)).map(p=>p.file);console.log('presentational count:',pres.length);console.log('exporter count:',exps.length);console.log('missing count:',missing.length);console.log('missing files:');missing.forEach(m=>console.log('- ',m));"
