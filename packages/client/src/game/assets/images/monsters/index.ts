import { createTexturesArray } from '../utils';
import bat1 from './bat-1.png';
import bat2 from './bat-2.png';
import bat3 from './bat-3.png';
import bat4 from './bat-4.png';

// Universal monster texture (used for all types with different colors)
const monster = createTexturesArray([bat1, bat2, bat3, bat4]);

export { monster as Monster };
