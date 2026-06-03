// Song Rental Library
// Saves the currently "rented" song to localStorage — no time limit.
// Rent: pick a song from the dropdown and click "Check It Out".
// Return: click "Return It". State persists across browser sessions.

document.addEventListener('DOMContentLoaded', function () {
    var rentBtn   = document.getElementById('rent-btn');
    var returnBtn = document.getElementById('return-btn');
    var select    = document.getElementById('rental-song-select');
    var display   = document.getElementById('rental-display');

    function render() {
        var rented = localStorage.getItem('rentedSong');
        if (rented) {
            display.textContent     = 'Currently checked out: "' + rented + '"';
            select.style.display    = 'none';
            rentBtn.style.display   = 'none';
            returnBtn.style.display = 'inline-block';
        } else {
            display.textContent     = 'Nothing checked out. Pick one!';
            select.style.display    = 'inline-block';
            rentBtn.style.display   = 'inline-block';
            returnBtn.style.display = 'none';
        }
    }

    rentBtn.addEventListener('click', function () {
        var chosen = select.value;
        if (chosen) {
            localStorage.setItem('rentedSong', chosen);
            render();
        }
    });

    returnBtn.addEventListener('click', function () {
        localStorage.removeItem('rentedSong');
        render();
    });

    render();
});
