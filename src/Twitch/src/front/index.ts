console.log(document.getElementById('wrapper'));

const options: Array<HTMLDivElement> = [];

interface IData
{
    votes: number;
    options: Array<[number, HTMLDivElement]>;
};


const data: IData = 
{
    votes: 0,
    options: []
};

function addEffectOption()
{
    const container = document.getElementById('container');

    if (container)
    {
        const newOption = document.createElement('div');
        data.options.push([0, newOption]);

        newOption.classList.add('vote-option');

        const progressBar = document.createElement('div');
        progressBar.classList.add('vote-option-progress-bar');
        // progressBar.style.transform = 'scaleX(0.0)';
        newOption.appendChild(progressBar);

        const wrapper = document.createElement('div');
        wrapper.classList.add('vote-option-wrapper');
        newOption.appendChild(wrapper);

        const optionID = data.options.length;

        const optionIndexElem = document.createElement('div');
        optionIndexElem.innerText = `${optionID}`;
        optionIndexElem.classList.add('vote-index');
        wrapper.appendChild(optionIndexElem);

        const optionNameElem = document.createElement('div');
        optionNameElem.innerText = `Effect #${optionID}`;
        optionNameElem.classList.add('vote-option-name');
        wrapper.appendChild(optionNameElem);

        const optionVotes = document.createElement('div');
        optionVotes.innerText = `0`;
        optionVotes.classList.add('vote-count');
        wrapper.appendChild(optionVotes);

        container.appendChild(newOption);
    }
}

function initOptions(num: number)
{
    for (let i = 0; i < num; i++)
    {
        addEffectOption();
    }
}

initOptions(4);


function updateEffects(effects: Array<string>): void
{
    for (let i = 0; i < effects.length; i++)
    {
        if (data.options[i])
        {
            data.options[i][0] = 0;
            const wrapper = data.options[i][1];
            (wrapper.children[0] as HTMLDivElement).style.transform = 'scaleX(0.0)';
            (wrapper as HTMLDivElement).style.opacity = '1.0';
            (wrapper.children[1].children[1] as HTMLDivElement).innerText = effects[i];
            (wrapper.children[1].children[2] as HTMLDivElement).innerText = `0`;
        }
    }

    data.votes = 0;
}

function updateVotes(votes: Array<number>)
{
    data.votes = votes.reduce((prev, now) => { return now+prev; });

    const votesElem = document.getElementById('votes');
    
    if (votesElem)
    {
        votesElem.innerText = `Votes: ${data.votes}`;
    }

    for (let i = 0; i < votes.length; i++)
    {
        const option = data.options[i];
        option[0] = votes[i];

        let percent = 0;

        if (votes[i])
        {
            percent = votes[i] / data.votes;

            if (percent > 1)
            {
                percent = 1;
            }
        }

        (option[1].children[0] as HTMLDivElement).style.transform = `scaleX(${percent})`;

        (option[1].children[1].children[2] as HTMLDivElement).innerText = `${votes[i]}`;
    }
}

function updateWinner(winnerID: number): void
{
    for (let i = 0; i < data.options.length; i++)
    {
        const option = data.options[i];

        let opacity = 1;

        if (winnerID != i)
        {
            opacity = 0.5;
        }

        (option[1] as HTMLDivElement).style.opacity = `${opacity}`;
    }
}

function pollStarted()
{
    const wrapper = document.getElementById('wrapper');

    if (wrapper)
    {
        wrapper.animate(
            [
                {
                    opacity: 0
                },
                {
                    opacity: 1
                }
            ],
            {
                duration: 1000,
                easing: 'linear',
                iterations: 1
            }
        );
    }
}

let connectionInterval: NodeJS.Timer | null = null;

function connectWS()
{
    const ws = new WebSocket('ws://localhost:9147');

    ws.onclose = (ev) =>
    {
        console.log(ev);

        if (connectionInterval)
        {
            clearInterval(connectionInterval);
            connectionInterval = null;
        }
        
        connectionInterval = setInterval(connectWS, 2000);
    }

    ws.onerror = (ev) =>
    {
        console.log(ev);
    }

    ws.onmessage = (ev) =>
    {
        try
        {
            const msg = JSON.parse(ev.data);

            console.log(msg);
            if (msg && msg.type)
            {
                switch (msg.type) {
                    case "new-options":
                        updateEffects(msg.data);
                        break;
                    case "update-votes":
                        updateVotes(msg.data);
                        break;
                    case "set-winner":
                        updateWinner(msg.data);
                        break;
                    case "poll-started":
                        pollStarted();
                        break;
                }
            }

        }
        catch (err)
        {
            console.error(err);
        }
    }

    ws.onopen = (ev) =>
    {
        if (connectionInterval)
        {
            clearInterval(connectionInterval);
            connectionInterval = null;
        }
    }
}

connectWS();