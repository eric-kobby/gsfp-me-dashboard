// Raw shapes as they arrive from the Kobo export (all values are strings).
export interface Submission {
  _id: string
  record_date: string
  term: string
  Region: string
  district: string
  school_name: string
  lat: string
  lon: string
  No_boys: string
  No_girls: string
  total_no: string
  t_caterers: string
  total_fed_caterers: string
  Do_you_have_the_daily_records_: string
  if_YES_are_they_in_use: string
  accordingMenu: string
  if_YES_is_it_being_followed: string
  meal_prepared_on_premises: string
  What_type_of_kitchen_is_availa: string
  Is_it_in_use: string
  What_is_the_source_of_water_fo: string
  natSecVF: string
  rCorVF: string
  rCorVF_001: string
  Have_you_received_a_nsurance_NHIS_card: string
  Do_you_know_about_the_Handy_Me: string
  Do_you_use_the_Handy_Measure_i: string
  Do_you_use_the_Handy_Measure_i_001: string
  How_easy_is_the_use_ng_and_serving_meals: string
  Monday: string
  Tuesday: string
  Wednesday: string
  Thursday: string
  Friday: string
  Where_do_you_buy_your_foodstuf: string
  What_percentage_of_f_are_locally_produced: string
  Do_you_know_of_any_FBOs: string
  Do_you_buy_from_the_FBOs: string
  How_many_days_do_you_cook_in_a_week: string
  What_is_your_source_of_Financi: string
  What_Challenges_do_you_face_as: string
  Do_you_eat_the_school_meals: string
  How_many_times_do_yo_chool_feeding_melas_: string
  Do_you_come_to_schoo_chool_feeding_meals_: string
  Apron: string
  Protective_shoes_safety_shoes: string
  Personal_Hygiene_of_caterer_cooks: string
  Meal_served_on_tables: string
  Food_Warmer_for_serving_meals: string
  Caterer_school_owned_feeding_bowls: string
  Food_Quantity_sufficient_per_child: string
  Quality_of_meals_ser_use_your_discretion: string
  Monitor_Name: string
}

export interface Caterer {
  _id: string
  term: string
  Region: string
  district: string
  school_name: string
  caterer_name: string
  enrollment: string
  health_screened: string
  cert_obtained: string
  cert_inspected: string
  total_cooks: string
  cooks_with_valid_cert: string
}

/** A filtered view of the dataset that every metric operates on. */
export interface Slice {
  subs: Submission[]
  cats: Caterer[]
}

/** The dimensions a metric can be broken down by, in drill order. */
export type Dimension = 'Region' | 'district' | 'school_name'

export interface Filters {
  region: string
  district: string
  term: string
}
