let audio_loaded = false;
let next_scroll_element = 0;

const themes_container = document.querySelector('.analise_config_themes');

const audio = document.querySelector("audio");
audio.addEventListener('loadedmetadata', (event) => {
  audio_loaded = true;
  audio.dataset.loaded = 1;
  audio.playbackRate = parseFloat(document.querySelector('#playback_rate').value);
  document.querySelector('#duration').value = audio.duration;
  append();
});
audio.addEventListener('playing', (e) => {
  refreshcurrentposition();
});

const audio_file = document.querySelector("#audio_file");
audio_file.addEventListener('change', function (event) {
  audio.src = URL.createObjectURL(audio_file.files[0]);
});

document.querySelector('#analise_block_mark_control').addEventListener('change', (e) => {
  if (e.target.checked) {
    document.querySelector('.transcription').classList.add('analise-mode-block-mark');
  } else {
    document.querySelector('.transcription').classList.remove('analise-mode-block-mark');
  }
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

const config_markonpause = document.querySelector('#config_markonpause');
const analise_mode_control = document.querySelector('#analise_mode');
const analise_apply_theme_control = document.querySelector('#analise_apply_theme_control');
analise_mode_control.addEventListener('change', (event) => {
  if (event.target.checked) {
    document.querySelector('.transcription').classList.add('analise-mode');
  } else {
    document.querySelector('.transcription').classList.remove('analise-mode');
  }
});


const load_from_file_input = document.querySelector('#load_from_file_input');
load_from_file_input.addEventListener('change', (event) => {
  load();
});

document.addEventListener('keyup', event => {
  /* hide shortcuts */
  document.querySelector('.shortcuts').style.display = 'none';
  document.querySelector('ol').classList.remove('info');
});

document.addEventListener('keydown', (event) => {
  let prevent_event = true;

  /* Show shortcuts */
  if (event.ctrlKey || event.shiftKey) {
    if (!analise_mode_control.checked) {
      document.querySelector('.shortcuts').style.display = 'block';
    }
    document.querySelector('ol').classList.add('info');
  }

  document.querySelectorAll('.shortcuts p.h').forEach(item => {
    item.classList.remove('h');
  });

  // MARK: KEYBOARD EVENTS 
  /* CTRL SHIFT EVENTS */
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
      case "KeyD": del();
        break;
      case "KeyS": save();
        break;
      case "KeyE": save_html();
        break;
      case "KeyK": export_audio_segments();
        break;
      case "KeyL": load();
        break;
      case "Enter": append(null, true);
        break;
      case "KeyA": analise_mode_control.click();
        break;
      case "KeyM": mark_analise();
        break;
      default: prevent_event = false;
    }

    /* SHIFT EVENTS */
  } else if (event.shiftKey) {
    /* Highlight shortcuts */
    document.querySelectorAll('.shortcuts p.shift').forEach(item => {
      item.classList.add('h');
    });

    if (!analise_mode_control.checked) {
      switch (event.code) {
        case "ArrowUp": playpause();
          break;
        case "ArrowDown": repeat();
          break;
        default: prevent_event = false;
      }
    } else {
      prevent_event = false;
    }

    /* CTRL EVENTS */
  } else if (event.ctrlKey) {
    /* Highlight shortcuts */
    document.querySelectorAll('.shortcuts p.ctrl').forEach(item => {
      item.classList.add('h');
    });
    switch (event.code) {
      case "BracketLeft": refreshtime(-0.5);
        break;
      case "BracketRight": refreshtime(0.5);
        break;
      case "Enter": append();
        break;
      case "ArrowDown": append();
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
      case "KeyR": playlastmark();
        break;
      case "KeyB": markabreak();
        break;
      default: prevent_event = false;
    }
  } else {
    prevent_event = false;
  }
  if (prevent_event) event.preventDefault();
});

function mark_analise() {
  if (analise_mode_control.checked) {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text !== '') {
      let theme = document.querySelector('input[name="theme-option"]:checked');
      const element = selection.anchorNode.parentElement;
      if (theme) {
        let cat = theme.parentElement.querySelectorAll('input[type="text"]')[0].value;
        let theme_background = theme.parentElement.querySelectorAll('input[type="color"]')[0].value.replace('#', '');
        let theme_color = theme.parentElement.querySelectorAll('input[type="color"]')[1].value.replace('#', '');
        element.innerHTML = element.innerHTML.replace(text, `<span data-cat="${cat}" style="background-color:#${theme_background}; color:#${theme_color}" class="theme-${theme_background}-${theme_color}">${text}</span>`);
        refresh_theme_count();
      } else {
        element.innerHTML = element.innerHTML.replace(text, `<span>${text}</span>`);
      }
    }
  }
}

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
  // Save mark
  if (config_markonpause.checked) {
    markabreak();
  }
};

function markabreak() {
  if (audio_loaded) {
    current_textarea = document.querySelector('textarea:focus');
    if (current_textarea) {
      if (!/\[\d+\.\d+\] ?$/g.test(current_textarea.value)) {
        document.querySelector('textarea:focus').value = `${document.querySelector('textarea:focus').value.trim()} [${audio.currentTime.toFixed(4)}] `;
      }
    }
  }
}

function playlastmark() {
  if (audio_loaded) {
    const textarea = document.querySelector('textarea:focus');
    if (textarea) {
      let marks = textarea.value.match(/\[\d+\.\d+\]/g);
      if (marks.length > 0) {
        audio.currentTime = parseFloat(marks[marks.length - 1].replace(/[\[\]]/g, ''));
        audio.play();
      }
    }
  }
}

function repeat() {
  if (audio_loaded) {
    const pointer = document.querySelector('ol li:last-child');
    audio.currentTime = parseFloat(pointer.dataset.position);
    audio.play();
  }
}

function seek(value) {
  if (audio_loaded) {
    audio.currentTime = audio.currentTime + parseFloat(value);
  }
}

function append(data, before) {
  /* Default values */
  let values = {
    name: '',
    position: audio.currentTime,
    text: '',
    analise: '',
  }
  /* Overwrite defaults */
  if (data) {
    values = { ...values, ...data };
    if (!data.hasOwnProperty('timestamp')) {
      values['timestamp'] = 0;
    }
  } else {
    values['timestamp'] = Date.now();
  }
  /* Create node */
  const node = createNode({
    type: 'li',
    attr: { 'data-timestamp': values.timestamp },
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
                let options = option_values.map(value => {
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
                return [{ type: 'option', attr: { value: '' }, content: '' }, ...options]
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
        content:
          [
            {
              type: 'textarea',
              attr: { placeholder: '<audio transcription>' },
              content: ((data) ? data.text : "")
            },
            {
              type: 'div',
              attr: { class: 'analise' },
              content: ((values.analise.trim() !== '') ? '$html:' + values.analise : values.text),
              events: {
                'dblclick': (e) => {
                  if (e.target.classList.contains('analise')) {
                    if (!e.target.classList.contains('analise-edit')) {
                      e.target.classList.add('analise-edit');
                      e.target.setAttribute('contenteditable', true);
                    } else {
                      e.target.previousSibling.value = e.target.innerText;
                      e.target.classList.remove('analise-edit');
                      e.target.removeAttribute('contenteditable');
                    }
                  } else {
                    const container = e.target.parentElement;
                    const target = e.target;
                    container.innerHTML = container.innerHTML.replace(target.outerHTML, target.innerHTML);
                    refresh_theme_count();
                  }
                },
                'click': (e) => {
                  if (!e.target.classList.contains('analise')) {
                    if (analise_apply_theme_control.checked) {
                      const theme = document.querySelector('input[name="theme-option"]:checked');
                      if (theme) {
                        let color_background = theme.parentElement.querySelectorAll('input[type="color"]')[0].value;
                        let color_text = theme.parentElement.querySelectorAll('input[type="color"]')[1].value;
                        let theme_label = theme.parentElement.querySelectorAll('input[type="text"]')[0].value;
                        e.target.style.backgroundColor = color_background;
                        e.target.style.color = color_text;
                        e.target.dataset.themeId = text_friendly(theme_label);
                        e.target.dataset.themeLabel = theme_label;
                      } else {
                        e.target.removeAttribute('data-theme-id');
                        e.target.removeAttribute('data-theme-label');
                        e.target.removeAttribute('style');
                      }
                      refresh_theme_count();
                    }
                  }
                }
              }
            }
          ]
      }
    ]
  });
  if (before) {
    document.querySelector('ol').insertBefore(node, document.querySelector('textarea:focus').parentElement.parentElement);
    node.querySelector('textarea').focus();
  } else {
    document.querySelector('ol').appendChild(node);
    document.querySelector('ol li:last-child textarea').focus();
  }
  remaptabindex();
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
    let v3 = 0;
    let t = ''
    if (e.nextSibling) {
      let v1 = parseFloat(e.childNodes[0].childNodes[1].firstChild.value);
      let v2 = parseFloat(e.nextSibling.childNodes[0].childNodes[1].firstChild.value);
      v3 = v2 - v1;
    }
    if (parseInt(e.dataset.timestamp) > 0) {
      const d = new Date(parseInt(e.dataset.timestamp));
      t = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
    }
    e.dataset.index = `${(i + 1)} | ${e.childNodes[1].childNodes[0].value.split(' ').length} w | ${formatTime(v3)} | ${t}`;
    e.querySelector('textarea').setAttribute('tabindex', i + 1);
  });
}

function formatTime(seconds) {
  // Convert seconds to milliseconds
  var milliseconds = seconds * 1000;

  // Create a new Date object with milliseconds
  var date = new Date(milliseconds);

  // Get hours, minutes, and seconds
  var hours = date.getUTCHours();
  var minutes = date.getUTCMinutes();
  var seconds = date.getUTCSeconds();

  // Format the time string
  var timeString = hours.toString().padStart(2, '0') + ":" +
    minutes.toString().padStart(2, '0') + ":" +
    seconds.toString().padStart(2, '0');

  return timeString;
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
      render_loaded(data);
    } else {
      alert('No data on local storage');
    }
    return;
  } else {
    const file_reader = new FileReader();
    file_reader.readAsText(load_from_file_input.files[0]);
    file_reader.onload = function (e) {
      reset();
      const data = JSON.parse(e.target.result);
      render_loaded(data);
    }
  }
}

function render_loaded(data) {
  document.querySelector('#name').value = (data.hasOwnProperty('name')) ? data.name : '';
  document.querySelector('#names').value = data.names;
  document.querySelector('#duration').value = data.duration;
  data.transcription.forEach(d => {
    append(d);
  });
  if (data.hasOwnProperty('analise_config')) {
    render_analise_themes_options(data.analise_config.themes);
  } else {
    render_analise_themes_options();
  }
}

function render_analise_themes_options(themes) {
  if (typeof themes === 'object') {
    while (themes_container.firstChild) {
      themes_container.removeChild(themes_container.firstChild);
    }
    themes.forEach(theme => {
      append_theme_option(theme);
    })
  }
}

function add_theme_option() {
  append_theme_option({
    background: '#000000',
    color: '#FFFFFF',
    label: `Theme ${document.querySelectorAll('.analise_config_themes li').length + 1}`
  });
}

function append_theme_option(theme) {
  const theme_id = text_friendly(theme.label);
  const theme_node = createNode({
    type: 'li',
    events: {
      'dblclick': (e) => {
        if (e.shiftKey) {
          if (e.target.dataset['id']) {
            document.querySelectorAll(`.analise span[data-theme-id='${e.target.dataset.id}']`).forEach(item => {
              let text = item.innerHTML;
              item.parentElement.innerHTML = item.parentElement.innerHTML.replace(item.outerHTML, text);
            });
            document.querySelector(`li[data-id="${e.target.dataset.id}"]`).remove();
            refresh_theme_count();
          }
        }
      }
    },
    attr: {
      'data-id': theme_id
    },
    content: [
      {
        type: 'label',
        content: [
          {
            type: 'input',
            attr: {
              type: 'checkbox',
              name: 'theme-option'
            }
          },
          {
            type: 'input',
            events: {
              'change': (e) => {
                handle_color_change(e.target);
              }
            },
            attr: {
              type: 'color',
              value: theme.background
            }
          },
          {
            type: 'input',
            events: {
              'change': (e) => {
                handle_color_change(e.target);
              }
            },
            attr: {
              type: 'color',
              value: theme.color
            }
          },
          {
            type: 'input',
            events: {
              'keydown': (e) => {
                const current_id = e.target.parentElement.parentElement.dataset.id;
                if (e.key.toLowerCase() === 'enter') {
                  let new_label = e.target.value.trim();
                  let new_id = text_friendly(new_label);
                  const duplicated = document.querySelectorAll(`.analise_config_themes li[data-id='${new_id}']`).length;
                  if (duplicated > 0) {
                    new_label = new_label + ' ' + (duplicated+1)
                    new_id = new_id + '_' + (duplicated+1)
                  }
                  document.querySelectorAll(`.analise span[data-theme-id='${current_id}']`).forEach(item => {
                    item.dataset.themeId = new_id;
                    item.dataset.themeLabel = new_label;
                  });
                  e.target.parentElement.parentElement.dataset.id = new_id;
                  e.target.value = new_label;
                  e.target.classList.remove('pending');
                } else {
                  if (text_friendly(e.target.value) !== current_id) {
                    e.target.classList.add('pending');
                  } else {
                    e.target.classList.remove('pending');
                  }
                }
              },
            },
            attr: {
              type: 'text',
              value: theme.label,
            }
          },
          {
            type: 'button',
            content: `${document.querySelectorAll(`span[data-theme-id='${theme_id}']`).length}`,
            attr: {
              'data-findnext': '0'
            },
            events: {
              'click': (e) => {
                let next = parseInt(e.target.dataset.findnext);
                const elements = document.querySelectorAll('span.' + e.target.parentElement.parentElement.dataset.id);
                if (next >= elements.length) {
                  next = 0;
                }
                scroll_to_element(elements[next]);
                e.target.dataset.findnext = next + 1;
              }
            }
          }
        ]
      }
    ]
  });
  themes_container.appendChild(theme_node);
}

function handle_color_change(input) {
  const theme_id = input.parentElement.parentElement.dataset.id;
  const color_background = input.parentElement.querySelectorAll('input[type="color"]')[0];
  const color_text = input.parentElement.querySelectorAll('input[type="color"]')[1].value;
  document.querySelectorAll(`.analise span[data-theme-id='${theme_id}']`).forEach(item => {
    item.style.backgroundColor = color_background;
    item.style.color = color_text;
  });
}

function parse_data_to_json() {
  let object_result = {
    name: document.querySelector('#name').value.trim(),
    names: document.querySelector('#names').value.trim(),
    duration: `${(audio.duration || document.querySelector('#duration').value)}`,
    analise_config: {
      themes: []
    },
    transcription: []
  }

  const data = document.querySelectorAll('ol li');
  data.forEach(e => {
    let o = {
      name: e.querySelector('select').value,
      position: e.querySelector('input[name="position"]').value,
      text: e.querySelector('textarea').value,
      analise: '$html:' + e.querySelector('.analise').innerHTML,
      timestamp: parseInt(e.dataset.timestamp)
    }
    object_result.transcription.push(o);
  });

  const themes = document.querySelectorAll('.analise_config_themes li').forEach(item => {
    object_result.analise_config.themes.push({
      background: item.querySelectorAll('input[type="color"]')[0].value,
      color: item.querySelectorAll('input[type="color"]')[1].value,
      label: item.querySelectorAll('input[type="text"]')[0].value,
    })
  });
  return object_result;
}

function save(browser_only) {
  const content = parse_data_to_json();
  window.localStorage.setItem('transcription', JSON.stringify(content));
  if (browser_only) return;

  // Export file
  export_json(content);
}

function save_html() {
  const content = parse_data_to_json();
  export_html(content);
}

function export_json(content) {
  const text_result = JSON.stringify(content);
  const a = document.createElement('a');
  const blob = new Blob([text_result], { type: "text/plain" });
  const clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
  });
  a.href = window.URL.createObjectURL(blob);
  a.download = `transcription-${content.name}-${Date.now()}.txt`;
  a.dispatchEvent(clickEvent);
}

function export_html(content) {
  let content_text = '';
  let i = 1;
  if (content) {
    content.transcription.map(t => {
      content_text += `<tr><td><p>${i}</p></td><td><p>${t.name}</p></td><td><p>${t.text}</p></td></tr>\n`;
      i++;
    });
  }
  let html_content = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Trascrição ${content.name} com ${content.transcription.length} fala(s)</title>
<style>
td,th { vertical-align:top; }
tr:nth-child(odd) { background-color:lightgray; }
</style>
</head>
<body>
<table>
<tr><th>#</th><th>Nome</th><th>Transcrição</th></tr>
${content_text}
</table>
</body>
</html>`;
  const a = document.createElement('a');
  const blob = new Blob([html_content], { type: "text/html" });
  const clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
  });
  a.href = window.URL.createObjectURL(blob);
  a.download = `document-${(content) ? content.name : ''}-${Date.now()}.html`;
  a.dispatchEvent(clickEvent);
}

function export_audio_segments() {
  const content = parse_data_to_json();
  let content_text = '';
  for (let i = 0; i < content.transcription.length; i = i + 1) {
    let next = (content.transcription[(i + 1)]) ? content.transcription[(i + 1)].position : content.duration;
    let length = parseFloat(next) - parseFloat(content.transcription[i].position);
    if (length <= 0) length += 1;
    content_text += `${(i + 1)}_${content.transcription[i].name},${parseFloat(content.transcription[i].position).toFixed(3)},${parseFloat(length).toFixed(3)}\n`
    //content_text += `ffmpeg -y -loglevel error -i "audio1.wav" -ss "${parseFloat(content.transcription[i].position).toFixed(3)}" -t "${parseFloat(length).toFixed(3)}" -q:a 0 "audio_segments/${(i+1)}_${content.transcription[i].name}.mp3"\n`
  }
  let csv_content = `id,start_time,length
${content_text}`;
  const a = document.createElement('a');
  const blob = new Blob([csv_content], { type: "text/html" });
  const clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
  });
  a.href = window.URL.createObjectURL(blob);
  a.download = `audio_segments-${(content) ? content.name : ''}-${Date.now()}.csv`;
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
      if (/^\$html\:/.test(node.content)) {
        nodeElement.innerHTML = node.content.replace(/\$html\:/g, '');
      } else {
        nodeElement.innerText = node.content;
      }
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
    let event;
    for (event in node.events) {
      if (node.events.hasOwnProperty(event)) {
        nodeElement.addEventListener(event, node.events[event], false);
      }
    }
  }
  return nodeElement;
}

function scroll_to_element(element) {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function refresh_theme_count() {
  document.querySelectorAll('.analise_config_themes button[data-findnext]').forEach(item => {
    item.innerText = document.querySelectorAll(`.analise span[data-theme-id='${item.parentElement.parentElement.dataset.id}']`).length;
  });
}

function isDeviceiPad() {
  return navigator.userAgent.match(/iPad/i);
}

function text_friendly(input) {
  return input.toString()               // Convert to string
    .normalize('NFD')               // Change diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove illegal characters
    .replace(/\s+/g, '-')            // Change whitespace to dashes
    .toLowerCase()                  // Change to lowercase
    .replace(/&/g, '-and-')          // Replace ampersand
    .replace(/[^a-z0-9\-]/g, '')     // Remove anything that is not a letter, number or dash
    .replace(/-+/g, '-')             // Remove duplicate dashes
    .replace(/^-*/, '')              // Remove starting dashes
    .replace(/-*$/, '');             // Remove trailing dashes
}