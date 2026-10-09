// Input types the calculator can price. Keep in sync with backend/services/factor_store.py;
// each entry is checked against the dataset so a stale id is dropped rather than shown.
import dataset from '../../../carbon_emission_factors_india.json';

const ids = new Set(dataset.emission_factors.map((f) => f.factor_id));
const keep = (map) => Object.keys(map).filter((k) => ids.has(map[k]));

const FUELS = { Petrol: 'petrol_user_supplied_2371', Diesel: 'diesel_user_supplied_264' };
const MATERIALS = {
  Steel: 'steel_user_supplied_21',
  Aluminium: 'aluminium_user_supplied_26',
  Cement: 'cement_user_supplied_076',
  'PET plastic': 'pet_user_supplied_3',
  'Paper / pulp': 'paper_pulp_user_supplied_198',
  'Timber (raw)': 'wood_raw_timber_user_supplied_0493',
  'Sawn wood': 'wood_sawn_user_supplied_0263',
  'Wood (burned)': 'wood_burned_user_supplied_0323',
  'Ethylene (naphtha route)': 'ethylene_naphtha_route_niti_2026',
  'Ethylene (ethane route)': 'ethylene_ethane_route_niti_2026',
  'Caustic soda': 'caustic_soda_user_supplied_290',
  'Soda ash (process)': 'soda_ash_process_niti_2026',
  'Cement clinker (process)': 'cement_clinker_process_niti_2026',
};
const WASTE = {
  'Food / organic waste (composted)': 'food_organic_waste_composted_user_supplied_032',
  'Food / organic waste (landfill)': 'food_organic_waste_landfill_user_supplied_129',
};

export const FUEL_TYPE_OPTIONS = keep(FUELS);
export const MATERIAL_TYPE_OPTIONS = keep(MATERIALS);
export const WASTE_TYPE_OPTIONS = keep(WASTE);
