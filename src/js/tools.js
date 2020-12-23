export function getObjByProperty(obj, propertyName, typeName) {
  return Object.values(obj).filter((value) => value[propertyName] === typeName)[0];
}

export function createSelectElement(optionsObj, defaultValue) {
  const $select = document.createElement('select');
  Object.values(optionsObj).forEach((value) => {
    const $option = document.createElement('option');
    $option.textContent = value.type;
    $option.value = value.key;
    $option.selected = (defaultValue === value.type);
    $select.appendChild($option);
  });
  return $select;
}

export function setLabel($FormElement, labelText) {
  const $label = document.createElement('label');
  $label.innerText = labelText;
  $label.appendChild($FormElement);
  return $label;
}

export function setOptionsSelected(newValue, $Select) {
  const newSelectedElement = [].filter.call($Select.childNodes,
    (option) => option.value === newValue);
  if (!newSelectedElement[0].selected) {
    newSelectedElement[0].selected = true;
  }
}
