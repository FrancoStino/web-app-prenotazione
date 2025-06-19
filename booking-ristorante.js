const Booking = {}


Booking.numeroPersoneW = document.getElementById('numero-persone-w')

Booking.numeroPersone = document.getElementById('numero-persone')

Booking.tavoliW = document.getElementById('tavoli-w')

Booking.tavoloSelezionato = document.getElementById('tavolo-selezionato')

Booking.messageStatus = document.getElementById('message-status')


async function costruisciSala() {
  Booking.sala = await fetch('sala.json');
  Booking.sala = await Booking.sala.json();

  Booking.tavoli = Booking.sala.tavoli;
  disponiTavoli(Booking.tavoli);
}

function disponiTavoli(tavoli) {
  tavoli.forEach(tavolo => {
    let classiTavolo = 'tavolo',
      tavoloDOM = document.createElement('div');
    tavoloDOM.appendChild(document.createTextNode(i + 1));
    classiTavolo += tavolo.occupato ? ' occupato' : ' libero';
    classiTavolo += tavolo.posti == 6 ? ' x6' : ' x4';
    tavoloDOM.setAttribute('class', classiTavolo);
    Booking.tavoliW.appendChild(tavoloDOM);
  })
}

costruisciSala()
