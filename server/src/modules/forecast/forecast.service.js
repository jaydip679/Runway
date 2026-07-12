const prisma = require('../../config/db');

const getForecast = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const forecast = await prisma.forecastSnapshot.findMany({
    where: {
      userId,
      forecastDate: {
        gte: today
      }
    },
    orderBy: {
      forecastDate: 'asc'
    }
  });

  if (forecast.length === 0) {
    return { ready: false, days: [] };
  }

  return { ready: true, days: forecast };
};

const getForecastSummary = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const forecast = await prisma.forecastSnapshot.findMany({
    where: {
      userId,
      forecastDate: {
        gte: today
      }
    },
    orderBy: {
      forecastDate: 'asc'
    }
  });

  if (forecast.length === 0) {
    return { ready: false };
  }

  const getDayBalance = (dayIndex) => {
    if (dayIndex < forecast.length) {
      return forecast[dayIndex].projectedBalance;
    }
    return forecast[forecast.length - 1].projectedBalance;
  };

  return {
    ready: true,
    day7Balance: getDayBalance(6),
    day30Balance: getDayBalance(29),
    day60Balance: getDayBalance(59),
    fullSeries: forecast // added full series so we can satisfy graphql shape if needed
  };
};

module.exports = {
  getForecast,
  getForecastSummary
};
