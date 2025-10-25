import { getHours } from "date-fns";

function calculateWindChill(temp, wind_kmh) {
  if (temp >= 24 || wind_kmh < 5) {
    return temp;
  }
  const wind_ms = wind_kmh / 3.6;
  const windChill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(wind_ms * 3.6, 0.16) + 0.3965 * temp * Math.pow(wind_ms * 3.6, 0.16);
  return parseFloat(windChill.toFixed(2));
}

function calculateHeatIndex(temp, humidity_percent) {
  if (temp <= 26 || humidity_percent <= 50) {
    return temp;
  }
  const hi = -8.78469475556 +
           1.61139411 * temp +
           2.33854883889 * humidity_percent +
           -0.14611605 * temp * humidity_percent +
           -0.012308094 * Math.pow(temp, 2) +
           -0.0164248277778 * Math.pow(humidity_percent, 2) +
           0.002211732 * Math.pow(temp, 2) * humidity_percent +
           0.00072546 * temp * Math.pow(humidity_percent, 2) +
           -0.000003582 * Math.pow(temp, 2) * Math.pow(humidity_percent, 2);
  return parseFloat(hi.toFixed(2));
}

function getDewPointComfort(dew_point) {
  if (dew_point > 24) return "extremamente abafado";
  if (dew_point >= 20) return "abafado";
  if (dew_point >= 13) return "confortável";
  if (dew_point >= 10) return "ar seco";
  return "muito seco";
}

function getCloudEffect(temp, cloud_cover_percent) {
  if (temp > 32 && cloud_cover_percent < 20) return "sol escaldante";
  if (temp >= 28 && cloud_cover_percent >= 30 && cloud_cover_percent <= 60) return "sol amenizado (ideal)";
  if (cloud_cover_percent > 85) return "céu fechado";
  return "normal";
}

function getWindDirectionEffect(wind_direction, wind_speed) {
  const WIND_EFFECT_THRESHOLD_KMH = 10;
  if (wind_speed < WIND_EFFECT_THRESHOLD_KMH) return "sem efeito";
  if (wind_direction >= 135 && wind_direction <= 225) return "refrescante";
  if (wind_direction >= 315 || wind_direction <= 45) return "quente";
  return "neutro";
}

export function aggregateHourlyData(hourlyRecords, startHour, endHour) {
    const periodRecords = hourlyRecords.filter(r => {
        const hour = getHours(new Date(r.timestamp));
        return hour >= startHour && hour <= endHour;
    });

    if (periodRecords.length === 0) {
        return null;
    }

    const metrics = {
        avg_temp: 0, max_temp: -Infinity, avg_wind: 0, max_wind_gust: 0,
        avg_humidity: 0, avg_dew_point: 0, max_uv: 0, total_precipitation: 0,
        max_precip_prob: 0, avg_cloud_cover: 0, avg_apparent_temp: 0, avg_aqi: 0,
        avg_pressure: 0, max_precip_hourly: 0, max_lightning_potential: 0
    };

    let total_wind_direction = 0;

    for (const r of periodRecords) {
        const {
            temperature, wind_speed, humidity, dew_point, cloud_cover, aqi,
            surface_pressure, precipitation, apparent_temperature, wind_gusts,
            uv_index, precipitation_probability, lightning_potential, wind_direction
        } = r;

        metrics.avg_temp += temperature;
        metrics.avg_wind += wind_speed;
        metrics.avg_humidity += humidity * 100;
        metrics.avg_dew_point += dew_point;
        metrics.avg_cloud_cover += cloud_cover;
        metrics.avg_aqi += aqi;
        metrics.avg_pressure += surface_pressure;
        metrics.total_precipitation += precipitation;
        metrics.avg_apparent_temp += apparent_temperature;
        total_wind_direction += wind_direction;

        if (temperature > metrics.max_temp) metrics.max_temp = temperature;
        if (wind_gusts > metrics.max_wind_gust) metrics.max_wind_gust = wind_gusts;
        if (uv_index > metrics.max_uv) metrics.max_uv = uv_index;
        if (precipitation_probability > metrics.max_precip_prob) metrics.max_precip_prob = precipitation_probability;
        if (precipitation > metrics.max_precip_hourly) metrics.max_precip_hourly = precipitation;
        if (lightning_potential > metrics.max_lightning_potential) metrics.max_lightning_potential = lightning_potential;
    }

    const count = periodRecords.length;
    metrics.avg_temp = parseFloat((metrics.avg_temp / count).toFixed(2));
    metrics.avg_wind = parseFloat((metrics.avg_wind / count).toFixed(2));
    metrics.avg_humidity = parseFloat((metrics.avg_humidity / count).toFixed(2));
    metrics.avg_dew_point = parseFloat((metrics.avg_dew_point / count).toFixed(2));
    metrics.avg_cloud_cover = parseFloat((metrics.avg_cloud_cover / count).toFixed(2));
    metrics.avg_aqi = parseFloat((metrics.avg_aqi / count).toFixed(2));
    metrics.avg_pressure = parseFloat((metrics.avg_pressure / count).toFixed(2));
    metrics.avg_apparent_temp = parseFloat((metrics.avg_apparent_temp / count).toFixed(2));
    
    const avg_wind_direction = total_wind_direction / count;

    metrics.derived_wind_chill = calculateWindChill(metrics.avg_temp, metrics.avg_wind);
    metrics.derived_heat_index = calculateHeatIndex(metrics.avg_temp, metrics.avg_humidity);
    metrics.derived_dew_comfort = getDewPointComfort(metrics.avg_dew_point);
    metrics.derived_cloud_effect = getCloudEffect(metrics.avg_temp, metrics.avg_cloud_cover * 100);
    metrics.derived_wind_direction_effect = getWindDirectionEffect(avg_wind_direction, metrics.avg_wind);

    return metrics;
}