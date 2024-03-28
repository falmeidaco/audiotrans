let audio_loaded = false;

const audio = document.querySelector("audio");
audio.addEventListener('loadedmetadata', (event) => {
  audio_loaded = true;
  audio.playbackRate = parseFloat(document.querySelector('#playback_rate').value);
  append();
});
audio.addEventListener('playing', (e) => {
  refreshcurrentposition();
});

const audio_file = document.querySelector("#audio_file");
audio_file.addEventListener('change', function (event) {
  audio.src = URL.createObjectURL(audio_file.files[0]);
});

document.querySelector('#playback_rate').addEventListener('change', (e) => {
  if (audio_loaded) {
    audio.playbackRate = parseFloat(e.target.value);
  }
});

const current_position = document.querySelector('#current_position');
function refreshcurrentposition() {
  if (audio_loaded) {
    current_position.value = audio.currentTime;
    window.requestAnimationFrame(refreshcurrentposition);
  }
}
window.requestAnimationFrame(refreshcurrentposition);

document.addEventListener('keyup', event => {
  /* hide shortcuts */
  document.querySelector('.shortcuts').style.display = 'none';
});

document.addEventListener('keydown', (event) => {
  let prevent_event = true;
  
  /* Show shortcuts */
  if (event.ctrlKey || event.shiftKey) document.querySelector('.shortcuts').style.display = 'block';
  document.querySelectorAll('.shortcuts p.h').forEach(item => {
    item.classList.remove('h');
  });

  if (event.ctrlKey && event.shiftKey) {
    /* Highlight shortcuts */
    document.querySelectorAll('.shortcuts p.ctrlshift').forEach(item => {
      item.classList.add('h');
    });
    switch (event.code) {
      case "ArrowLeft": seek(-1);
        break;
      case "ArrowRight": seek(1);
        break;
      case "BracketLeft": refreshtime(-0.5);
        break;
      case "BracketRight": refreshtime(0.5);
        break;
      case "KeyD": del();
        break;
      case "KeyS": save();
        break;
      case "KeyL": load();
        break;
      default: prevent_event = false;
    }
  } else if (event.shiftKey) {
    /* Highlight shortcuts */
    document.querySelectorAll('.shortcuts p.shift').forEach(item => {
      item.classList.add('h');
    });

    switch (event.code) {
      case "ArrowUp": playpause();
        break;
      case "ArrowDown": repeat();
        break;
      default: prevent_event = false;
    }
  } else if (event.ctrlKey) {
    /* Highlight shortcuts */
    document.querySelectorAll('.shortcuts p.ctrl').forEach(item => {
      item.classList.add('h');
    });
    switch (event.code) {
      case "Enter": append();
        break;
      case "Space": playpause();
        break;
      case "KeyP": playcurrent();
        break;
      case "KeyU": refreshtime();
        break;
      case "KeyS": save(true);
        break;
      case "KeyL": load(true);
        break;
      default: prevent_event = false;
    }
  } else {
    prevent_event = false;
  }
  if (prevent_event) event.preventDefault();
});

function playpause() {
  if (!audio_loaded) {
    audio_file.click();
    return;
  }
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
};

function repeat() {
  const pointer = document.querySelector('ol li:last-child');
  audio.currentTime = parseFloat(pointer.dataset.position);
  audio.play();
}

function seek(value) {
  audio.currentTime = audio.currentTime + parseFloat(value);
}

function append(data) {
  /* Default values */
  let values = {
    name: '',
    position: audio.currentTime,
    text: ''
  }
  /* Overwrite defaults */
  if (data) {
    values = { ...values, ...data };
  }
  /* Create node */
  const node = createNode({
    type: 'li',
    content: [
      {
        type: 'div',
        content: [
          {
            type: 'div',
            content: {
              type: 'select',
              content: (function (name) {
                /* Load names */
                let option_values = document.querySelector('#names').value.split(',');
                /* Parse name as options */
                let options =  option_values.map(value => {
                  let option = {
                    type: 'option',
                    attr: { value: value.toUpperCase() },
                    content: value.toUpperCase()
                  }
                  /* Check for current name as selected */
                  if (value.toLowerCase() === name.toLowerCase()) {
                    option.attr['selected'] = 'selected';
                  }
                  return option;
                });
                return [{type:'option', attr:{value:''}, content:''}, ...options]
              }(values.name))
            }
          },
          {
            type: 'div',
            content: {
              type: 'input',
              attr: { name: 'position', value: ((data) ? data.position : audio.currentTime) }
            }
          },
          {
            type: 'div',
            content: [
              {
                type: 'button',
                content: 'Delete',
                events: {
                  'click': function (e) {
                    del(e.target);
                  }
                }
              },
              {
                type: 'button',
                content: 'Play',
                events: {
                  'click': function (e) {
                    play(e.target);
                  }
                }
              }
            ]
          }
        ]
      },
      {
        type: 'div',
        content: {
          type: 'textarea',
          attr: { placeholder: '<audio transcription>' },
          content: ((data) ? data.text : "")
        }
      }
    ]
  });
  document.querySelector('ol').appendChild(node);
  remaptabindex();
  document.querySelector('ol li:last-child textarea').focus();
}

function select(target) {
  target.querySelector('textarea').focus();
}

function playcurrent() {
  const current = document.querySelector('textarea:focus');
  if (current) {
    audio.currentTime = parseFloat(current.parentElement.parentElement.querySelector('input[name="position"]').value);
    audio.play();
  }
}

function refreshtime(value) {
  const current = document.querySelector('textarea:focus');
  if (current) {
    if (value) {
      let current_value = current.parentElement.parentElement.querySelector('input[name="position"]').value;
      current.parentElement.parentElement.querySelector('input[name="position"]').value = parseFloat(current_value) + parseFloat(value);
    } else {
      current.parentElement.parentElement.querySelector('input[name="position"]').value = audio.currentTime;
    }
  }
}

function play(element) {
  if (audio_loaded) {
    if (typeof element === 'object') {
      audio.currentTime = parseFloat(element.parentElement.parentElement.parentElement.querySelector('input[name="position"]').value);
    } else {
      audio.currentTime.element;
    }
    audio.play();
  }
}

function remaptabindex() {
  document.querySelectorAll('ol li').forEach((e, i) => {
    e.querySelector('textarea').setAttribute('tabindex', i + 1);
  });
}

function del(element) {
  if (document.querySelectorAll('ol li').length > 1) {
    if (element) {
      element.parentElement.parentElement.parentElement.remove();
    } else {
      document.querySelector('ol li:has(textarea:focus)').remove();
    }
    remaptabindex();
  }
}

function reset() {
  const container = document.querySelector('ol');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function load(browser) {

  if (browser) {
    if (window.localStorage.hasOwnProperty('transcription')) {
      let data = JSON.parse(window.localStorage.getItem('transcription'));
      document.querySelector('#names').value = data.names;
      data.transcription.forEach(d => {
        append(d);
      })
    } else {
      alert('No data on local storage');
    }
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.addEventListener('change', event => {
    const file_reader = new FileReader();
    file_reader.readAsText(input.files[0]);
    file_reader.onload = function (e) {
      reset();
      const data = JSON.parse(e.target.result);
      document.querySelector('#names').value = data.names;
      data.transcription.forEach(d => {
        append(d);
      });
    }
  });
  input.click();
}

function save(browser_only) {
  let object_result = {
    names: document.querySelector('#names').value.trim(),
    transcription: []
  };

  let text_result = '';
  const data = document.querySelectorAll('ol li');
  data.forEach(e => {
    let o = {
      name: e.querySelector('select').value,
      position: e.querySelector('input[name="position"]').value,
      text: e.querySelector('textarea').value
    }
    object_result.transcription.push(o);
    text_result += `${o.s}[${o.p}]: ${o.t}\n---\n`;
  });

  text_result = JSON.stringify(object_result);

  window.localStorage.setItem('transcription', text_result);
  if (browser_only) return;

  // Save browser
  const a = document.createElement('a');
  const blob = new Blob([text_result], { type: "text/plain" });
  const clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
  });
  a.href = window.URL.createObjectURL(blob);
  a.download = `transcription-${Date.now()}.txt`;
  a.dispatchEvent(clickEvent);
}

function createNode(node) {
  var i, data, attribute, nodeContent, nodeElement = (node.type === "img") ? new Image() : document.createElement(node.type);
  //Attributes
  if (node.hasOwnProperty('attr')) {
    for (attribute in node.attr) {
      if (node.attr.hasOwnProperty(attribute)) {
        if (attribute === 'dataset') {
          for (data in node.attr[attribute]) {
            if (node.attr[attribute].hasOwnProperty(data)) {
              nodeElement.dataset[data] = node.attr[attribute][data];
            }
          }
        } else if (node.type === 'input' && attribute === 'value') {
          nodeElement.value = node.attr[attribute];
        } else {
          if (typeof node.attr[attribute] === "object") {
            if (node.attr[attribute].condition) {
              nodeElement.setAttribute(attribute, node.attr[attribute].value);
            }
          } else {
            nodeElement.setAttribute(attribute, node.attr[attribute]);
          }
        }
      }
    }
  }
  //Content
  if (node.hasOwnProperty('content') && node.type !== "img") {
    if (typeof node.content === "string") {
      //nodeContent = document.createTextNode(node.content);
      //nodeElement.appendChild(nodeContent);
      nodeElement.innerText = node.content;
    } else if (typeof node.content === "object") {
      if (node.content.constructor === Array) {
        for (i = 0; i < node.content.length; i += 1) {
          nodeContent = createNode(node.content[i]);
          nodeElement.appendChild(nodeContent);
        }
      } else {
        nodeContent = createNode(node.content);
        nodeElement.appendChild(nodeContent);
      }
    }
  }
  //Events
  if (node.hasOwnProperty('events')) {
    for (event in node.events) {
      if (node.events.hasOwnProperty(event)) {
        nodeElement.addEventListener(event, node.events[event], false);
      }
    }
  }
  return nodeElement;
}