# Sync-AppData.ps1
# Copies the cleaned CSVs from ..\data into the app as JSON modules that the
# dashboard imports at build time. Run after Refresh-KoboData.ps1 whenever new
# submissions have been pulled, then rebuild (npm run build) or restart the dev server.
#   powershell -ExecutionPolicy Bypass -File .\Sync-AppData.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$data = Join-Path (Split-Path -Parent $root) 'data'
$out  = Join-Path $root 'src\data'

$subFields = @('_id','record_date','term','Region','district','school_name','emis_code','lat','lon','No_boys','No_girls','total_no','t_caterers','total_fed_caterers','Do_you_have_the_daily_records_','if_YES_are_they_in_use','accordingMenu','if_YES_is_it_being_followed','meal_prepared_on_premises','What_type_of_kitchen_is_availa','Is_it_in_use','What_is_the_source_of_water_fo','natSecVF','rCorVF','rCorVF_001','Have_you_received_a_nsurance_NHIS_card','Do_you_know_about_the_Handy_Me','Do_you_use_the_Handy_Measure_i','Do_you_use_the_Handy_Measure_i_001','How_easy_is_the_use_ng_and_serving_meals','Monday','Tuesday','Wednesday','Thursday','Friday','Where_do_you_buy_your_foodstuf','What_percentage_of_f_are_locally_produced','Do_you_know_of_any_FBOs','Do_you_buy_from_the_FBOs','How_many_days_do_you_cook_in_a_week','What_is_your_source_of_Financi','What_Challenges_do_you_face_as','Do_you_eat_the_school_meals','How_many_times_do_yo_chool_feeding_melas_','Do_you_come_to_schoo_chool_feeding_meals_','Apron','Protective_shoes_safety_shoes','Personal_Hygiene_of_caterer_cooks','Meal_served_on_tables','Food_Warmer_for_serving_meals','Caterer_school_owned_feeding_bowls','Food_Quantity_sufficient_per_child','Quality_of_meals_ser_use_your_discretion','Monitor_Name')
$catFields = @('_id','term','record_date','Region','district','school_name','caterer_name','phone','enrollment','health_screened','cert_obtained','cert_inspected','total_cooks','cooks_with_valid_cert','ncd_1st_term','ncd_2nd_term','ncd_3rd_term')

Import-Csv (Join-Path $data 'submissions.csv') | Select-Object $subFields | ConvertTo-Json -Depth 4 |
  Out-File (Join-Path $out 'submissions.json') -Encoding utf8
Import-Csv (Join-Path $data 'caterers.csv') | Select-Object $catFields | ConvertTo-Json -Depth 4 |
  Out-File (Join-Path $out 'caterers.json') -Encoding utf8

$s = (Import-Csv (Join-Path $data 'submissions.csv')).Count
$c = (Import-Csv (Join-Path $data 'caterers.csv')).Count
Write-Host "Synced $s submissions and $c caterers into src\data. Rebuild or restart the dev server to see them."
