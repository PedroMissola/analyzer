// src/analysis/rules/scoreRules.js

/**
 * Configurações de pontuação, pesos e regras para cada tipo de análise.
 * Externalizado para facilitar a manutenção.
 */
export const scoreConfigs = {
    pool: {
        weights: {
            temperature: 20, apparent_temp: 18, wind: 18, dew_point: 15,
            uv: 10, clouds: 8, precipitation: 8, amplitude: 5,
            day_length: 3, wind_direction: 5,
        },
        rules: {
            temperature: (v) => {
                if (v < 25 || v > 35) return 0.25;
                if (v >= 28 && v <= 32) return 1.0;
                if (v < 28) return Math.max(0.25, 1.0 - (28 - v) * 0.1);
                return Math.max(0.25, 1.0 - (v - 32) * 0.075);
            },
            apparent_temp: (v) => {
                if (v >= 27 && v <= 31) return 1.0;
                if (v < 27) return Math.max(0, 1.0 - (27 - v) * 0.083);
                return Math.max(0, 1.0 - (v - 31) * 0.083);
            },
            wind: (v, { temp }) => {
                if (v > 30) return 0;
                if (v > 25) return 0.28;
                if (temp >= 30 && v >= 12 && v <= 22) return 1.0;
                if (temp >= 30 && v < 10) return 0.55;
                if (temp >= 28 && temp < 30 && v >= 8 && v <= 18) return 1.0;
                if (temp < 28 && v > 15) return 0.28;
                if (temp < 28 && v <= 15) return 0.77;
                return 0.55;
            },
            dew_point: (v) => {
                if (v > 24) return 0; if (v > 22) return 0.27;
                if (v > 20) return 0.53; if (v > 18) return 0.8;
                if (v >= 13) return 1.0; if (v >= 10) return 0.67;
                return 0.33;
            },
            uv: (v) => {
                if (v > 11) return 0.2; if (v >= 9) return 0.5;
                if (v < 2) return 0.5; if (v >= 3 && v <= 7) return 1.0;
                return 0.8;
            },
            clouds: (v, { temp }) => {
                if (temp > 32 && v < 20) return 0.25;
                if (temp >= 28 && v >= 30 && v <= 60) return 1.0;
                if (v >= 10 && v < 30) return 0.875;
                if (v > 50 && v <= 70) return 0.75;
                if (v > 85) return 0.375;
                return 0.875;
            },
            precipitation: (v) => (v > 0.3 ? -1.875 : v >= 0.2 ? -1.0 : 1.0),
            amplitude: (v) => {
                if (v < 5) return 1.0; if (v <= 8) return 0.8;
                if (v <= 12) return 0.4; return 0;
            },
            day_length: (v) => (v > 13 ? 1.0 : v >= 11 ? 0.67 : 0.33),
            wind_direction: (v, { temp }) => {
                if (v === "refrescante" && temp > 28) return 1.0;
                if (v === "quente" && temp > 28) return 0.4;
                return 0.6;
            },
        }
    },
    work: {
        weights: {
            temperature: 30, wind: 22, dew_point: 20,
            pressure: 15, aqi: 8, precipitation: 5,
        },
        rules: {
            temperature: (v) => {
                if (v < 12 || v > 35) return 0; if (v < 16 || v > 30) return 0.17;
                if (v < 18 || v > 28) return 0.33; if (v < 20 || v > 26) return 0.6;
                if (v >= 22 && v <= 24) return 1.0; return 0.83;
            },
            wind: (v, { temp }) => {
                if (v > 35) return 0; if (v > 25) return 0.23;
                if (v >= 15) {
                    if (temp > 28) return 0.68; if (temp < 22) return 0.36;
                    return 0.55;
                }
                if (v >= 10) return (temp > 28 ? 0.91 : 0.82);
                return 1.0;
            },
            dew_point: (v) => {
                if (v > 24) return 0; if (v > 22) return 0.25;
                if (v > 20) return 0.5; if (v > 18) return 0.8;
                if (v >= 13) return 1.0; return 0.4;
            },
            pressure: (v) => {
                if (v < 1000 || v > 1030) return 0;
                if (v < 1005 || v > 1025) return 0.33;
                if (v < 1010 || v > 1020) return 0.67;
                return 1.0;
            },
            aqi: (v) => {
                if (v > 200) return 0; if (v > 150) return 0.125;
                if (v > 100) return 0.375; if (v > 50) return 0.75;
                return 1.0;
            },
            precipitation: (v) => {
                if (v > 10) return 0; if (v > 5) return 0.2;
                if (v > 2) return 0.6; return 1.0;
            },
        }
    },
    risk: {
        penalties: {
            wind: (v, { wind_speed }) => {
                if (v > 90) return -100; if (v > 70) return -80;
                if (v > 50) return -50; if (wind_speed > 50) return -40;
                if (wind_speed > 35) return -25; if (wind_speed > 25) return -10;
                return 0;
            },
            precipitation: (v) => {
                if (v > 30) return -60; if (v > 20) return -40;
                if (v > 10) return -25; if (v > 5) return -10;
                return 0;
            },
            lightning: (v) => {
                if (v > 80) return -50; if (v > 50) return -30;
                if (v > 20) return -15; return 0;
            },
            aqi: (v) => {
                if (v > 200) return -40; if (v > 150) return -25;
                if (v > 100) return -10; return 0;
            },
            extreme_temp: (v, { temp_max }) => {
                if (v < 5) return -30; if (v < 10) return -15;
                if (temp_max > 40) return -30; if (temp_max > 38) return -15;
                return 0;
            },
            uv: (v) => (v > 11 ? -10 : 0),
        }
    }
};
