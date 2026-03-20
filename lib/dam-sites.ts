import { DamSite } from './types';

export const DAM_SITES: DamSite[] = [
  {
    id: 'inanda-dam',
    name: 'Inanda Dam',
    worker_count: 75,
    has_supervisor: false,
    latitude: -29.8167,
    longitude: 30.8667,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'nagle-dam',
    name: 'Nagle Dam',
    worker_count: 43,
    has_supervisor: false,
    latitude: -29.7167,
    longitude: 30.9167,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'albert-falls-dam',
    name: 'Albert Falls Dam',
    worker_count: 38,
    has_supervisor: true,
    latitude: -29.5667,
    longitude: 30.7167,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'midmar-dam',
    name: 'Midmar Dam',
    worker_count: 35,
    has_supervisor: true,
    latitude: -29.65,
    longitude: 30.4833,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'hazelmere-dam',
    name: 'Hazelmere Dam',
    worker_count: 28,
    has_supervisor: true,
    latitude: -30.05,
    longitude: 30.85,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'shongweni-dam',
    name: 'Shongweni Dam',
    worker_count: 25,
    has_supervisor: true,
    latitude: -29.75,
    longitude: 30.55,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'hluhluwe-dam',
    name: 'Hluhluwe Dam',
    worker_count: 30,
    has_supervisor: true,
    latitude: -28.8,
    longitude: 31.9,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'pongolapoort-dam',
    name: 'Pongolapoort Dam',
    worker_count: 30,
    has_supervisor: true,
    latitude: -27.7833,
    longitude: 32.35,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'goedertrouw-dam',
    name: 'Goedertrouw Dam',
    worker_count: 25,
    has_supervisor: true,
    latitude: -28.9667,
    longitude: 31.7667,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'bloemhoek-dam',
    name: 'Bloemhoek Dam',
    worker_count: 25,
    has_supervisor: true,
    latitude: -29.0,
    longitude: 31.8,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'mearns-dam',
    name: 'Mearns Dam',
    worker_count: 25,
    has_supervisor: true,
    latitude: -28.7167,
    longitude: 31.35,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'spring-grove-dam',
    name: 'Spring Grove Dam',
    worker_count: 25,
    has_supervisor: true,
    latitude: -28.6833,
    longitude: 31.25,
    province: 'KwaZulu-Natal',
  },
  {
    id: 'wagendrift-dam',
    name: 'Wagendrift Dam',
    worker_count: 25,
    has_supervisor: true,
    latitude: -28.3333,
    longitude: 31.1,
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
