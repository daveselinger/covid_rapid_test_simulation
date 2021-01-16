
window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)',
    white: 'rgb(255,255,255)'
};

function initChart(timesteps) {
    var config = {
        type: 'line',
        data: {
            datasets: [{
                label: 'Unknown',
                backgroundColor: window.chartColors.white,
                data: [],
                pointRadius: 0,
            }, {
                label: 'Dec',
                backgroundColor: window.chartColors.green,
                data: [],
                pointRadius: 0,
            }, {
                label: 'Inf',
                backgroundColor: window.chartColors.red,
                data: [],
                pointRadius: 0,
            }, {
                label: 'Rec',
                backgroundColor: window.chartColors.yellow,
                data: [],
                pointRadius: 0,
            }, {
                label: 'Sus',
                backgroundColor: window.chartColors.blue,
                data: [],
                pointRadius: 0,
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'S(usceptible), I(nfected), R(ecovered), D(eceased)'
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Days'
                    },
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    suggestedMax: 100
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display:true,
                        labelString: 'Percent'
                    }
                }]
            }
        }
    };

    for (t = 0; t < timesteps; t++) {
        config.data.datasets[0].data.push({x:t, y:100});
        config.data.datasets[1].data.push({x:t, y:0});
        config.data.datasets[2].data.push({x:t, y:0});
        config.data.datasets[3].data.push({x:t, y:0});
        config.data.datasets[4].data.push({x:t, y:0});
    }
    return config;
}

function setDayData(config, day, sus, exp, inf, rec) {
    if (sus + exp + inf + rec == 0) {
        config.data.datasets[0].data[day] = {x:t, y:100};
    } else {
        config.data.datasets[0].data[day] = {x:t, y:0};
    }
    config.data.datasets[1].data[day] = {x:day, y:sus};
    config.data.datasets[2].data[day] = {x:day, y:exp};
    config.data.datasets[3].data[day] = {x:day, y:inf};
    config.data.datasets[4].data[day] = {x:day, y:rec};
}