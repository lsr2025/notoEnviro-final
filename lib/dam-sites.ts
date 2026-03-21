import { DamSite } from './types';

export const DAM_SITES: DamSite[] = [
  {
    id: 'INANDA',
    name: 'Inanda Dam',
    worker_count: 75,
    has_supervisor: false,
    latitude: -29.8167,
    longitude: 30.8667,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'NAGLE',
    name: 'Nagle Dam',
    worker_count: 43,
    has_supervisor: false,
    latitude: -29.7167,
    longitude: 30.9167,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'ALBERT_FALLS',
    name: 'Albert Falls Dam',
    worker_count: 106,
    has_supervisor: true,
    latitude: -29.5667,
    longitude: 30.7167,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'HAZELMERE',
    name: 'Hazelmere Dam',
    worker_count: 55,
    has_supervisor: true,
    latitude: -30.0500,
    longitude: 30.8500,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'NUNGWANE',
    name: 'Nungwane Dam',
    worker_count: 39,
    has_supervisor: true,
    latitude: -29.8500,
    longitude: 30.9500,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'SPRING_GROVE',
    name: 'Spring Grove Dam',
    worker_count: 11,
    has_supervisor: true,
    latitude: -29.4333,
    longitude: 30.0000,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'EJ_SMITH',
    name: 'EJ Smith Dam',
    worker_count: 26,
    has_supervisor: true,
    latitude: -29.9167,
    longitude: 30.5000,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'DARVILL',
    name: 'Darvill Wetlands',
    worker_count: 15,
    has_supervisor: true,
    latitude: -29.6167,
    longitude: 30.4167,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'IMVUTSHANE',
    name: 'Imvutshane Dam',
    worker_count: 28,
    has_supervisor: true,
    latitude: -29.4500,
    longitude: 29.8500,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'IXOPO',
    name: 'Ixopo Dam',
    worker_count: 19,
    has_supervisor: true,
    latitude: -30.1500,
    longitude: 30.0700,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'ST_JOSEPH',
    name: 'St Joseph Dam',
    worker_count: 12,
    has_supervisor: true,
    latitude: -30.2500,
    longitude: 30.4000,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'UMZINTO',
    name: 'Umzinto Dam',
    worker_count: 26,
    has_supervisor: true,
    latitude: -30.3167,
    longitude: 30.6833,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'HQ',
    name: 'Head Office',
    worker_count: 31,
    has_supervisor: true,
    latitude: -29.8587,
    longitude: 31.0218,
    province: 'KwaZulu-Natal',
  },
];

export const getDamSiteById = (id: string): DamSite | undefined => {
  return DAM_SITES.find(site => site.id === id);
};

export const getDamSiteByName = (name: string): DamSite | undefined => {
  return DAM_SITES.find(site => site.name === name);
};

export const getDamSitesWithoutSupervisor = (): DamSite[] => {
  return DAM_SITES.filter(site => !site.has_supervisor);
};
