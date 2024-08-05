let audio_loaded = false;
let current_mark;

const intersection_filter_control = document.querySelector('#intersection_filter_control');
intersection_filter_control.addEventListener('change', apply_filter);

document.querySelector('#theme_save_button').addEventListener('click', (e) => {
  let themes = '';
  document.querySelectorAll('.theme_modal select').forEach(item => {
    if (item.value.trim() !== '') {
      themes += item.value + '; ';
    }
  });
  themes += document.querySelector('#new_theme_label').value.trim();
  themes = themes.trim().replace(/(^;|;$)/, '').trim();
  if (themes.trim() !== '') {
    current_mark.dataset.themeLabel = themes;
  } else {
    current_mark.removeAttribute('data-theme-label');
  }
  if (!document.querySelector('input[name="theme-filter"]:checked')) {
    process_themes();
  }
  open_hide_modal();
});

document.querySelector('#theme_cancel_button').addEventListener('click', (e) => {
  open_hide_modal();
});

document.querySelector('#theme_reset_button').addEventListener('click', (e) => {
  current_mark.removeAttribute('data-theme-label');
  process_themes();
  open_hide_modal();
});

document.querySelector('#analise_block_mark_control').addEventListener('change', (e) => {
  if (e.target.checked) {
    document.querySelector('.transcription').classList.add('analise-mode-block-mark');
  } else {
    document.querySelector('.transcription').classList.remove('analise-mode-block-mark');
  }
});

function open_hide_modal() {
  const modal = document.querySelector('.theme_modal');
  if (modal.classList.contains('show_theme_modal')) {
    modal.classList.remove('show_theme_modal');
  } else {
    modal.classList.add('show_theme_modal');
  }
}

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

const load_from_file_input = document.querySelector('#load_from_file_input');
load_from_file_input.addEventListener('change', (event) => {
  load();
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

analise_mode_control.addEventListener('change', (event) => {
  if (event.target.checked) {
    document.querySelector('.transcription').classList.add('analise-mode');
  } else {
    document.querySelector('.transcription').classList.remove('analise-mode');
  }
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
    document.querySelector('.shortcuts').style.display = 'block';
    document.querySelector('ol').classList.add('info');
  }
  document.querySelectorAll('.shortcuts p.h').forEach(item => {
    item.classList.remove('h');
  });

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
      case "KeyM": mark_analise();
        break;
      case "Enter": append(null, true);
        break;
      case "KeyA": analise_mode_control.click();
        break;
      default: prevent_event = false;
    }

    /* SHIFT EVENTS */
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

function mark_analise() {
  if (analise_mode_control.checked) {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text !== '') {
      const element = selection.anchorNode.parentElement;
      element.innerHTML = element.innerHTML.replace(text, `<span data-theme-label="Geral">${text}</span>`);
    }
    remap_marks();
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
              content: ((values.analise.trim() !== '') ? values.analise : values.text),
              events: {
                'dblclick': (e) => {
                  if (e.shiftKey) {
                    const container = e.target.parentElement;
                    const target = e.target;
                    container.innerHTML = container.innerHTML.replace(target.outerHTML, target.innerHTML);
                    process_themes();
                    remap_marks();
                  } else {
                    if (e.target.classList.contains('analise')) {
                      if (!e.target.classList.contains('analise-edit')) {
                        e.target.classList.add('analise-edit');
                        e.target.setAttribute('contenteditable', true);
                      } else {
                        e.target.previousSibling.value = e.target.innerText;
                        e.target.classList.remove('analise-edit');
                        e.target.removeAttribute('contenteditable');
                        save(true);
                      }
                    } else {
                      current_mark = e.target;
                      open_theme_modal(e.target);
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
  remap_marks();
}

function open_theme_modal(current) {
  current_mark = current;
  const modal = document.querySelector('.theme_modal');
  const modal_themes = modal.querySelector('.themes');
  let themes = [];
  document.querySelectorAll('.analise_config_themes li').forEach(item => {
    themes.push(item.dataset.themeLabel);
  })
  /* Reset modal */
  modal.querySelector('#new_theme_label').value = '';
  modal.querySelectorAll('select').forEach(select => select.remove());

  if (current.dataset.hasOwnProperty('themeLabel')) {
    let current_labels = current.dataset.themeLabel.split(";");
    current_labels.forEach(current_label => {
      modal_themes.appendChild(createNode({
        type: 'select',
        content: (function () {
          let options = [{
            type: 'option',
            content: '--- Select one ---',
            attr: {
              value: ''
            }
          }];
          themes.forEach(theme => {
            options.push({
              type: 'option',
              content: theme,
              attr: (function () {
                if (theme == current_label.trim()) {
                  return {
                    value: theme,
                    selected: 'selected'
                  }
                } else {
                  return {
                    value: theme
                  }
                }
              }())
            })
          })
          return options;
        }())
      }))
    });
  }
  append_theme_blank_option(modal_themes, themes);
  open_hide_modal();
}

function append_theme_blank_option(modal_themes, themes) {
  modal_themes.appendChild(createNode({
    type: 'select',
    events: {
      change: (e) => {
        if (e.target.value.trim() !== '') {
          append_theme_blank_option(modal_themes, themes)
        }
      }
    },
    content: (function () {
      let options = [{
        type: 'option',
        content: '--- Select one ---',
        attr: {
          value: ''
        }
      }];
      themes.forEach(theme => {
        options.push({
          type: 'option',
          content: theme,
          attr: {
            value: theme
          }
        })
      })
      return options;
    }())
  }))
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
  process_themes();
  // if (data.hasOwnProperty('analise_config')) {
  //   render_analise_themes_options(data.analise_config.themes);
  // } else {
  //   render_analise_themes_options();
  // }
}

function process_themes() {
  const current_themes = document.querySelectorAll('.analise span[data-theme-label');
  let themes = {};
  current_themes.forEach(theme => {
    theme.removeAttribute('class');
    let author = '';
    if (theme.parentElement.nodeName.toLocaleLowerCase() !== 'span') {
      author = theme.parentElement.parentElement.parentElement.querySelector('select').value.toLowerCase();
    } else {
      author = theme.parentElement.parentElement.parentElement.parentElement.querySelector('select').value.toLowerCase();
    }
    theme.removeAttribute('data-theme-id');
    theme.removeAttribute('style');
    theme_labels = theme.dataset.themeLabel.split(";");
    theme_labels.forEach(theme_label => {
      theme_id = text_friendly(theme_label.trim());
      if (!themes[theme_id]) {
        themes[theme_id] = {
          label: theme_label,
          count: 1,
          participation: {}
        }
        themes[theme_id].participation[author] = 1;
      } else {
        themes[theme_id].count += 1;
        if (themes[theme_id].participation.hasOwnProperty(author)) {
          themes[theme_id].participation[author] = themes[theme_id].participation[author] + 1;
        } else {
          themes[theme_id].participation[author] = 1;
        }
      }
    });
  });
  const ordered = Object.keys(themes).sort().reduce(
    (obj, key) => {
      obj[key] = themes[key];
      return obj;
    },
    {}
  );
  render_theme_list(ordered, current_themes.length);
}

function render_theme_list(themes, length) {
  const list_elements = document.querySelector('#analise_config_themes_container');
  while (list_elements.firstChild) {
    list_elements.removeChild(list_elements.firstChild);
  }
  for (let theme in themes) {
    list_elements.appendChild(createNode({
      type: 'li',
      attr: {
        'data-theme-id': theme,
        'data-theme-label': themes[theme].label.trim(),
        'data-findnext': '0'
      },
      styleprops: {
        'data-presence-percent': `${Math.ceil((themes[theme].count / length) * 100)}%`,
        'data-presence-percent-inverse': `${Math.ceil(100 - (themes[theme].count / length) * 100)}%`,
        'data-presence-percent-as-int': Math.ceil((themes[theme].count / length) * 100)
      },
      content: [
        {
          type: 'div',
          events: {
            'click': (e) => {
              let next = parseInt(e.target.parentElement.dataset.findnext);
              const elements = document.querySelectorAll(`span[data-theme-label*='${e.target.parentElement.dataset.themeLabel}']`);
              if (next >= elements.length) {
                next = 0;
              }
              scroll_to_element(elements[next]);
              e.target.parentElement.dataset.findnext = next + 1;
            }
          },
          content: `$html:${themes[theme].label} (<strong>${themes[theme].count}</strong>/${Math.ceil((themes[theme].count / length) * 100)}%) (${Object.keys(themes[theme].participation).length})`
        },
        {
          type: 'input',
          attr: {
            type: 'checkbox',
            name: 'theme-filter',
            'data-theme-label': themes[theme].label.trim()
          },
          events: {
            'change': (e) => {
              apply_filter();
            }
          }
        },
        {
          type: 'input',
          attr: {
            type: 'checkbox',
            name: 'theme-filter-remove',
            'data-theme-label': themes[theme].label.trim()
          },
          events: {
            'change': (e) => {
              apply_filter();
            }
          }
        },
        {
          type: 'button',
          attr: {
            'data-theme-label': themes[theme].label.trim()
          },
          events: {
            'click': (e) => {
              const current_name = e.target.dataset.themeLabel
              const new_name = window.prompt('New name', current_name);
              if (typeof new_name === 'string' && new_name !== current_name) {
                document.querySelectorAll(`.analise span[data-theme-label*="${current_name}"]`).forEach(item => {
                  item.dataset.themeLabel = item.dataset.themeLabel.replace(current_name, new_name);
                });
                process_themes();
              }
            }
          },
          content:'R'
        }
      ]
    }));
  }
}

function apply_filter() {
  const theme_filters = document.querySelectorAll('input[name="theme-filter"]:checked');
  const theme_filters_remove = document.querySelectorAll('input[name="theme-filter-remove"]:checked');
  if (theme_filters.length > 0) {
    if (intersection_filter_control.checked) {
      document.querySelectorAll('input[name="theme-filter"]').forEach(item => item.setAttribute('disabled', 'disabled'));
    } else {
      document.querySelectorAll('input[name="theme-filter"]').forEach(item => item.removeAttribute('disabled'));
    }
    let filter_regex_pattern = '';
    theme_filters.forEach(item => {
      if (!intersection_filter_control.checked) {
        filter_regex_pattern += item.dataset.themeLabel + '|';
      } else {
        filter_regex_pattern += `(?=.*${item.dataset.themeLabel})`;
      }
    });
    filter_regex_pattern = `${filter_regex_pattern.replace(/\|$/g, '')}`;
    const filter_regex = new RegExp(`data\\-theme\\-label\\=\\"([A-Za-zŽžÀ-ÖØ-Ýà-öø-ÿ \\;\\-]+)?(${filter_regex_pattern})\\;?`, "g");
    const theme_filter_regex = new RegExp(`(${filter_regex_pattern})`, "g");

    let filter_remove_regex_pattern = '';
    let filter_remove_regex;
    if (theme_filters_remove.length > 0) {
      theme_filters_remove.forEach(item => {
        filter_remove_regex_pattern += item.dataset.themeLabel + '|';
      });
      filter_remove_regex_pattern = `${filter_remove_regex_pattern.replace(/\|$/g, '')}`;
      filter_remove_regex = new RegExp(`(${filter_remove_regex_pattern})`, "g");
    }

    document.querySelectorAll('.analise').forEach(item => {
      if (filter_regex.test(item.innerHTML)) {
        item.parentElement.parentElement.style.display = 'flex';
        
        item.querySelectorAll('span[data-theme-label]').forEach(span => {
          span.classList.remove('h');
          if (span.dataset.themeLabel.search(theme_filter_regex) > -1) {
            span.classList.add('h');
            if (intersection_filter_control.checked) {
              span.dataset.themeLabel.split(';').forEach(span_theme => {
                document.querySelector(`input[name="theme-filter"][data-theme-label="${span_theme.trim()}"]`).removeAttribute('disabled');
              });
            }
          }
          /* Disable highlight from exclusion filter */
          if (theme_filters_remove.length > 0) {
            if (span.dataset.themeLabel.search(filter_remove_regex) > -1) {
              span.classList.remove('h');
            }
          }
        });
      } else {
        item.parentElement.parentElement.style.display = 'none';
      }
    });
  } else {
    /* Reset */
    document.querySelectorAll('input[name="theme-filter"]').forEach(item => item.removeAttribute('disabled'));
    document.querySelectorAll('ol li').forEach(item => item.style.display = 'flex');
    document.querySelectorAll('span.h').forEach(item => item.classList.remove('h'));
    process_themes();
  }
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
  let html_content = '';
  let i = 1;
  if (analise_mode_control.checked) {
    const transcription = document.querySelectorAll('.transcription li');
    let line_id = 1;
    transcription.forEach(line => {
      const speaker = line.querySelector('select').value;
      const segments = line.querySelectorAll('span[data-theme-label');
      let segment_id = 1;
      segments.forEach(segment => {
        content_text += `
        <tr>
          <td>${line_id}</td>
          <td>${speaker}</td>
          <td>${segment_id}</td>
          <td>${((segment.dataset.hasOwnProperty('themeLabel')) ? segment.dataset.themeLabel : "")}</td>
          <td>${((segment.parentElement.nodeName.toLocaleLowerCase() == "span") ? "L" : "")}</td>
          <td>${segment.innerHTML}</td>
        </tr>`;
        segment_id += 1;
      });
      line_id += 1;
    });
    html_content = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Trascrição codificada</title>
<style>
td,th { vertical-align:top; }
tr:nth-child(odd) { background-color:lightgray; }
span span { font-weight: 500; }
</style>
</head>
<body>
<table>
<tr>
  <th>#S</th>
  <th>Nome</th>
  <th>#T</th>
  <th>Tema</th>
  <th>F</th>
  <th>Trecho</th>
</tr>
${content_text}
</table>
</body>
</html>`;
  } else {
    if (content) {
      const transcription = document.querySelectorAll('.transcription li');
      let line_id = 1;
      transcription.forEach(line => {
        if (line.querySelectorAll('span').length > 0) {
          let segment_index = 1;
          line.querySelectorAll('span').forEach(segment => {
            if (segment.dataset.hasOwnProperty('themeLabel')) {
              segment.dataset.index = `${segment_index}`;
              segment_index += 1;
            }
          });
        }
        content_text += `<tr><td><p>${line_id}</p></td><td><p>${line.querySelector('select').value}</p></td><td><p>${line.querySelector('.analise').innerHTML.replace(/style\=\"[\w\d\(\)\-\,\:\; ]+\"/g, '')}</p></td></tr>\n`;
        line_id += 1;
      });
      html_content = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Trascrição ${content.name} com ${content.transcription.length} fala(s)</title>
<style>
td,th { vertical-align:top; }
tr:nth-child(odd) { background-color:lightgray; }
span::before {content:'[[';font-weight:bold;}
span::after {content:']]';font-weight:bold;}
span[data-theme-id]::before { content:"[["attr(data-index)"] "; }
</style>
</head>
<body>
<table>
<tr><th>#</th><th>Nome</th><th>Transcrição</th></tr>
${content_text}
</table>

</body>
</html>`;
    }
  }

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
  //Events
  if (node.hasOwnProperty('styleprops')) {
    let styleprop;
    for (styleprop in node.styleprops) {
      if (node.styleprops.hasOwnProperty(styleprop)) {
        nodeElement.style.setProperty('--' + styleprop, node.styleprops[styleprop]);
      }
    }
  }
  return nodeElement;
}

function isDeviceiPad() {
  return navigator.userAgent.match(/iPad/i);
}

function scroll_to_element(element) {
  document.querySelectorAll('span.current').forEach(item => item.removeAttribute('class'));
  if (element) {
    element.classList.add('current');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function remap_marks() {
  document.querySelectorAll('.analise').forEach(item => {
    let i = 1;
    item.querySelectorAll('span').forEach(item_span => {
      item_span.dataset.index = i;
      i +=1;
    });
  });
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


if (window.location.hash == "#devmode") {
  load(true);
  analise_mode_control.click();
}
