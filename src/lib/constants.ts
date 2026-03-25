export const BASE_PRICE = 8995;

export const generateFloorPricing = () => {
  const floors = [];
  for (let floor = 37; floor >= 1; floor--) {
    let price = BASE_PRICE;
    if (floor >= 4) {
      price = BASE_PRICE + (37 - floor) * 20;
    } else if (floor === 3) {
      price = BASE_PRICE + (37 - 4) * 20 + 50;
    } else if (floor === 2) {
      price = BASE_PRICE + (37 - 4) * 20 + 100;
    } else if (floor === 1) {
      price = BASE_PRICE + (37 - 4) * 20 + 150;
    }
    
    floors.push({
      floor,
      label: floor === 1 ? "First Floor" : `${floor}${getOrdinalSuffix(floor)} Floor`,
      price,
    });
  }
  return floors;
};

function getOrdinalSuffix(i: number) {
  const j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

export const FLOOR_PRICING = generateFloorPricing();

export const UNIT_SIZES = [
  { label: "2195 sq.ft (3 BHK + 3 Toilets)", value: 2195 },
  { label: "2595 sq.ft (3 BHK + Home Office)", value: 2595 },
  { label: "3495 sq.ft (4 BHK + Home Office)", value: 3495 },
];

export const ADDITIONAL_CHARGES = {
  CAR_PARKING: 495000,
  CLUB_MEMBERSHIP: 395000,
  CORNER_PLC_PER_SQFT: 200,
  EEC_FFC_PER_SQFT: 225,
  IFMS_PER_SQFT: 50,
};
