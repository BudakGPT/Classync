import { createAvatar } from '@dicebear/core'
import { avataaars } from '@dicebear/collection'
import { hash, rng } from './utils'

// Illustrated avatars generated locally (no network). Featured characters have hand-tuned looks so they
// stay recognisable across every screen; everyone else gets a deterministic look derived from their id.

type Opts = Record<string, unknown>
const BASE: Opts = { mouth: ['smile'], eyes: ['default'], eyebrows: ['defaultNatural'], accessoriesProbability: 0, facialHairProbability: 0, topProbability: 100 }
const BG = ['e5e5fc', 'dbeafe', 'ccfbf1', 'fef3c7', 'fce7f3', 'd1fae5', 'ede9fe', 'ffedd5']

const FEATURED: Record<string, Opts> = {
  maya: { top: ['hijab'], hatColor: ['5b5bd6'], clothing: ['blazerAndShirt'], clothesColor: ['3c4f5c'], skinColor: ['edb98a'], accessories: ['prescription02'], accessoriesProbability: 100, backgroundColor: ['ede9fe'] },
  andi: { top: ['shortFlat'], hairColor: ['2c1b18'], facialHair: ['beardLight'], facialHairColor: ['2c1b18'], facialHairProbability: 100, clothing: ['blazerAndSweater'], clothesColor: ['262e33'], skinColor: ['d08b5b'], accessories: ['round'], accessoriesProbability: 100, backgroundColor: ['dbeafe'] },
  farhan: { top: ['theCaesarAndSidePart'], hairColor: ['2c1b18'], clothing: ['collarAndSweater'], clothesColor: ['5199e4'], skinColor: ['d08b5b'], eyes: ['happy'], backgroundColor: ['e5e5fc'] },
  sarah: { top: ['straight01'], hairColor: ['4a312c'], clothing: ['shirtScoopNeck'], clothesColor: ['ff488e'], skinColor: ['ffdbb4'], backgroundColor: ['fce7f3'] },
  haekal: { top: ['shortWaved'], hairColor: ['2c1b18'], clothing: ['hoodie'], clothesColor: ['65c9ff'], skinColor: ['d08b5b'], backgroundColor: ['dbeafe'] },
  malik: { top: ['shortCurly'], hairColor: ['2c1b18'], clothing: ['shirtCrewNeck'], clothesColor: ['ffffb1'], skinColor: ['ae5d29'], accessories: ['prescription01'], accessoriesProbability: 100, backgroundColor: ['fef3c7'] },
  helven: { top: ['longButNotTooLong'], hairColor: ['4a312c'], clothing: ['shirtVNeck'], clothesColor: ['a7ffc4'], skinColor: ['ffdbb4'], backgroundColor: ['d1fae5'] },
  erik: { top: ['shortRound'], hairColor: ['724133'], clothing: ['hoodie'], clothesColor: ['262e33'], skinColor: ['edb98a'], backgroundColor: ['ffedd5'] },
  dylan: { top: ['frizzle'], hairColor: ['2c1b18'], clothing: ['shirtCrewNeck'], clothesColor: ['ff5c5c'], skinColor: ['ae5d29'], backgroundColor: ['ccfbf1'] },
  nadia: { top: ['hijab'], hatColor: ['ffafb9'], clothing: ['collarAndSweater'], clothesColor: ['e6e6e6'], skinColor: ['edb98a'], eyes: ['happy'], backgroundColor: ['fce7f3'] },
  kevin: { top: ['shortFlat'], hairColor: ['2c1b18'], clothing: ['hoodie'], clothesColor: ['929598'], skinColor: ['ffdbb4'], accessories: ['prescription01'], accessoriesProbability: 100, backgroundColor: ['ccfbf1'] },
  rania: { top: ['hijab'], hatColor: ['25557c'], clothing: ['shirtScoopNeck'], clothesColor: ['ffffff'], skinColor: ['d08b5b'], backgroundColor: ['dbeafe'] },
  arif: { top: ['theCaesar'], hairColor: ['2c1b18'], facialHair: ['beardLight'], facialHairProbability: 100, facialHairColor: ['2c1b18'], clothing: ['shirtCrewNeck'], clothesColor: ['25557c'], skinColor: ['d08b5b'], backgroundColor: ['fef3c7'] },
  putri: { top: ['bob'], hairColor: ['2c1b18'], clothing: ['overall'], clothesColor: ['ffdeb5'], skinColor: ['d08b5b'], backgroundColor: ['ede9fe'] },
  bagus: { top: ['shaggy'], hairColor: ['2c1b18'], clothing: ['hoodie'], clothesColor: ['3c4f5c'], skinColor: ['ae5d29'], backgroundColor: ['d1fae5'] },
  citra: { top: ['curvy'], hairColor: ['4a312c'], clothing: ['shirtVNeck'], clothesColor: ['ffafb9'], skinColor: ['edb98a'], backgroundColor: ['ffedd5'] },
  yusuf: { top: ['shortCurly'], hairColor: ['2c1b18'], facialHair: ['beardMedium'], facialHairProbability: 100, facialHairColor: ['2c1b18'], clothing: ['collarAndSweater'], clothesColor: ['25557c'], skinColor: ['d08b5b'], backgroundColor: ['e5e5fc'] },
  jessica: { top: ['bun'], hairColor: ['2c1b18'], clothing: ['shirtScoopNeck'], clothesColor: ['b1e2ff'], skinColor: ['ffdbb4'], backgroundColor: ['fce7f3'] },
  gilang: { top: ['shortRound'], hairColor: ['2c1b18'], clothing: ['collarAndSweater'], clothesColor: ['ff5c5c'], skinColor: ['d08b5b'], backgroundColor: ['ccfbf1'] },
}

const FEMALE = new Set(['Aisyah', 'Alya', 'Anisa', 'Bella', 'Cahya', 'Dewi', 'Fitri', 'Hana', 'Indah', 'Jihan', 'Kamila', 'Laras', 'Mega', 'Olivia', 'Qonita', 'Rizka', 'Salsa', 'Tasya', 'Vania', 'Winona', 'Zahra', 'Grace', 'Clara', 'Michelle', 'Nathania', 'Ayu', 'Dinda', 'Farah', 'Intan', 'Nabila', 'Aurel', 'Salma', 'Keisha', 'Eka'])
const F_TOPS = ['straight01', 'straight02', 'bob', 'bun', 'curly', 'curvy', 'longButNotTooLong', 'miaWallace', 'bigHair', 'straightAndStrand']
const M_TOPS = ['shortFlat', 'shortRound', 'shortWaved', 'shortCurly', 'theCaesar', 'theCaesarAndSidePart', 'sides', 'frizzle', 'shaggy', 'dreads01']
const F_CLOTH = ['shirtScoopNeck', 'shirtVNeck', 'collarAndSweater', 'hoodie', 'overall', 'shirtCrewNeck']
const M_CLOTH = ['hoodie', 'shirtCrewNeck', 'shirtVNeck', 'collarAndSweater', 'blazerAndShirt']
const CLOTH_COLORS = ['65c9ff', '5199e4', '25557c', '262e33', '3c4f5c', '929598', 'a7ffc4', 'b1e2ff', 'ffafb9', 'ffdeb5', 'ff5c5c', 'ffffb1', 'e6e6e6']
const HIJAB = ['5199e4', '25557c', 'ffafb9', '3c4f5c', '929598', 'a7ffc4', 'ffdeb5', 'e6e6e6', 'b1e2ff']
const SKIN = ['edb98a', 'd08b5b', 'd08b5b', 'ae5d29', 'ffdbb4']
const HAIR = ['2c1b18', '2c1b18', '2c1b18', '4a312c', '724133']

function generated(id: string, name: string): Opts {
  const r = rng(hash(id))
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const female = FEMALE.has(name.split(' ')[0])
  const o: Opts = {
    clothing: [pick(female ? F_CLOTH : M_CLOTH)], clothesColor: [pick(CLOTH_COLORS)], skinColor: [pick(SKIN)],
    mouth: [pick(['smile', 'smile', 'default', 'twinkle'])], eyes: [pick(['default', 'default', 'happy'])],
    backgroundColor: [BG[hash(id) % BG.length]],
  }
  if (female && r() < 0.35) Object.assign(o, { top: ['hijab'], hatColor: [pick(HIJAB)] })
  else Object.assign(o, { top: [pick(female ? F_TOPS : M_TOPS)], hairColor: [pick(HAIR)] })
  if (!female && r() < 0.14) Object.assign(o, { facialHair: ['beardLight'], facialHairProbability: 100, facialHairColor: ['2c1b18'] })
  if (r() < 0.18) Object.assign(o, { accessories: [pick(['prescription01', 'prescription02', 'round'])], accessoriesProbability: 100 })
  return o
}

const cache = new Map<string, string>()

/** Data-URI SVG avatar for a person id. `name` improves generated looks for non-featured people. */
export function avatarUri(id: string, name = ''): string {
  let uri = cache.get(id)
  if (!uri) {
    uri = createAvatar(avataaars, { seed: id, ...BASE, ...(FEATURED[id] ?? generated(id, name)) }).toDataUri() ?? ''
    cache.set(id, uri)
  }
  return uri
}
