import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 15000,
});

export async function fetchOverview()       { const r = await API.get('/api/overview');                    return r.data; }
export async function fetchModels()         { const r = await API.get('/api/models');                      return r.data; }
export async function fetchInterventions()  { const r = await API.get('/api/interventions');               return r.data; }
export async function fetchFarmerBenefits() { const r = await API.get('/api/farmer-benefits');             return r.data; }
export async function fetchDataset(params)  { const r = await API.get('/api/dataset', { params });         return r.data; }
export async function postPredict(body)     { const r = await API.post('/api/predict', body);              return r.data; }

export default API;
