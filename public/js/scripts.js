const fetchBusData = async () => {
  try {
    const response = await fetch('/next-departure')

    if (!response.ok) {
      throw new Error(`Что-то пошло не так попробуйте позже ${response.status}`);
    }

    return response.json();

  } catch (error) {
    console.error(`Ошибка получения данных от сервера ${error}`);
  }
};

const renderDateContent = () => {
  const contentDateTime = document.querySelector('#time');
  contentDateTime.textContent = "";
  const date = new Date().toLocaleString();
  contentDateTime.textContent = date;
};

const formatDate = (date) => date.toISOString().split("T")[0];
const formatTime = (date) => date.toTimeString().split(" ")[0].slice(0, 5);

const renderBusData = (buses) => {
  const tableBody = document.querySelector('#bus tbody');
  tableBody.textContent = '';



  buses.forEach(bus => {
    const row = document.createElement('tr');

    const nextDepartureDateTimeUTC = new Date(`${bus.nextDeparture.date}T${bus.nextDeparture.time}Z`,);

    row.innerHTML = `
      <td>${bus.busNumber}</td>
        <td>${bus.startPoint} - ${bus.endPoint}Озерск - Чита</td>
        <td>${formatDate(nextDepartureDateTimeUTC)}</td>
      <td>${formatTime(nextDepartureDateTimeUTC)}</td>
    `
    tableBody.append(row);
  })
};

const init = async () => {
  renderDateContent();

  const buses = await fetchBusData();

  renderBusData(buses);

};

init();