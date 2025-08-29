import { createTexturesArray } from '../utils';
import bat1 from './bat-1.png';
import bat2 from './bat-2.png';
import bat3 from './bat-3.png';
import bat4 from './bat-4.png';
import vampire1 from './vampire/vampire_v2_1.png';
import vampire2 from './vampire/vampire_v2_2.png';
import vampire3 from './vampire/vampire_v2_3.png';
import vampire4 from './vampire/vampire_v2_4.png';

// Universal monster texture (used for all types with different colors)
const monster = createTexturesArray([bat1, bat2, bat3, bat4]);

// Vampire-specific texture
const vampire = createTexturesArray([vampire1, vampire2, vampire3, vampire4]);

export { monster as Monster, vampire as Vampire };
