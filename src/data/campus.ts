import floor1 from '../assets/campus/floor-1.svg'
import floor2 from '../assets/campus/floor-2.svg'
import floor3 from '../assets/campus/floor-3.svg'
import floor4 from '../assets/campus/floor-4.svg'

export type FloorId = 1 | 2 | 3 | 4

export interface CampusRoom {
  /** Номер аудитории, как в расписании: «401», «117», «Спортзал 2» */
  code: string
  floor: FloorId
  /** Центр хотспота в процентах от картинки этажа */
  x: number
  y: number
  /** Размер хотспота в процентах от картинки этажа */
  w: number
  h: number
  /** Не аудитория, а помещение общего назначения */
  kind?: 'canteen' | 'gym'
}

export interface CampusFloor {
  id: FloorId
  title: string
  image: string
  rooms: CampusRoom[]
}

export const CAMPUS = {
  building: 'Корпус А',
  address: 'ул. Образцова, 9с9',
}

/**
 * Как подменить схему на свою картинку:
 * 1. положи файл в src/assets/campus/ (например floor-1.png);
 * 2. поменяй import выше;
 * 3. подгони x/y/w/h у аудиторий — это проценты от картинки.
 * Подбирать координаты удобно в режиме /campus?edit=1 (клик по карте печатает %).
 */
export const CAMPUS_FLOORS: CampusFloor[] = [
  {
    id: 1,
    title: '1 этаж',
    image: floor1,
    rooms: [
      { code: '117', floor: 1, x: 15.2, y: 23.8, w: 20.4, h: 32.5 },
      { code: '115', floor: 1, x: 36.9, y: 23.8, w: 20.4, h: 32.5 },
      { code: '110', floor: 1, x: 58.5, y: 23.8, w: 20.4, h: 32.5 },
      { code: '105', floor: 1, x: 80.2, y: 23.8, w: 20.4, h: 32.5 },
      { code: '101', floor: 1, x: 15.2, y: 76.2, w: 20.4, h: 32.5, kind: 'canteen' },
      { code: '102', floor: 1, x: 36.9, y: 76.2, w: 20.4, h: 32.5 },
      { code: 'Спортзал 2', floor: 1, x: 58.5, y: 76.2, w: 20.4, h: 32.5, kind: 'gym' },
      { code: '103', floor: 1, x: 80.2, y: 76.2, w: 20.4, h: 32.5 },
    ],
  },
  {
    id: 2,
    title: '2 этаж',
    image: floor2,
    rooms: [
      { code: '208', floor: 2, x: 15.2, y: 23.8, w: 20.4, h: 32.5 },
      { code: '205', floor: 2, x: 36.9, y: 23.8, w: 20.4, h: 32.5 },
      { code: '202', floor: 2, x: 58.5, y: 23.8, w: 20.4, h: 32.5 },
      { code: '201', floor: 2, x: 80.2, y: 23.8, w: 20.4, h: 32.5 },
      { code: '210', floor: 2, x: 15.2, y: 76.2, w: 20.4, h: 32.5 },
      { code: '212', floor: 2, x: 36.9, y: 76.2, w: 20.4, h: 32.5 },
      { code: '215', floor: 2, x: 58.5, y: 76.2, w: 20.4, h: 32.5 },
      { code: '218', floor: 2, x: 80.2, y: 76.2, w: 20.4, h: 32.5 },
    ],
  },
  {
    id: 3,
    title: '3 этаж',
    image: floor3,
    rooms: [
      { code: '305', floor: 3, x: 15.2, y: 23.8, w: 20.4, h: 32.5 },
      { code: '306', floor: 3, x: 36.9, y: 23.8, w: 20.4, h: 32.5 },
      { code: '310', floor: 3, x: 58.5, y: 23.8, w: 20.4, h: 32.5 },
      { code: '302', floor: 3, x: 80.2, y: 23.8, w: 20.4, h: 32.5 },
      { code: '301', floor: 3, x: 15.2, y: 76.2, w: 20.4, h: 32.5 },
      { code: '315', floor: 3, x: 36.9, y: 76.2, w: 20.4, h: 32.5 },
      { code: '318', floor: 3, x: 58.5, y: 76.2, w: 20.4, h: 32.5 },
      { code: '320', floor: 3, x: 80.2, y: 76.2, w: 20.4, h: 32.5 },
    ],
  },
  {
    id: 4,
    title: '4 этаж',
    image: floor4,
    rooms: [
      { code: '401', floor: 4, x: 15.2, y: 23.8, w: 20.4, h: 32.5 },
      { code: '412', floor: 4, x: 36.9, y: 23.8, w: 20.4, h: 32.5 },
      { code: '405', floor: 4, x: 58.5, y: 23.8, w: 20.4, h: 32.5 },
      { code: '402', floor: 4, x: 80.2, y: 23.8, w: 20.4, h: 32.5 },
      { code: '410', floor: 4, x: 15.2, y: 76.2, w: 20.4, h: 32.5 },
      { code: '415', floor: 4, x: 36.9, y: 76.2, w: 20.4, h: 32.5 },
      { code: '418', floor: 4, x: 58.5, y: 76.2, w: 20.4, h: 32.5 },
      { code: '420', floor: 4, x: 80.2, y: 76.2, w: 20.4, h: 32.5 },
    ],
  },
]

/** «ауд. 401», «401», « 401 » → «401» */
export function normalizeRoom(code: string): string {
  return code
    .toLowerCase()
    .replace(/ауд\.?\s*/g, '')
    .replace(/[№#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findRoom(code: string): { floor: CampusFloor; room: CampusRoom } | null {
  const needle = normalizeRoom(code)
  if (!needle) return null
  for (const floor of CAMPUS_FLOORS) {
    const room = floor.rooms.find((r) => normalizeRoom(r.code) === needle)
    if (room) return { floor, room }
  }
  return null
}

export function roomsWithLessons(codes: string[]): Set<string> {
  const set = new Set<string>()
  for (const code of codes) {
    const found = findRoom(code)
    if (found) set.add(normalizeRoom(found.room.code))
  }
  return set
}

export const floorLabel = (id: FloorId) => `${id} этаж`
