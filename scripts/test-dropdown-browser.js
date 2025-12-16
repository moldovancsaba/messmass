/**
 * Browser Console Test for Template Dropdown
 * 
 * Copy and paste this into the browser console on /admin/visualization page
 * to debug the dropdown issue
 */

console.log('🔍 Testing Template Dropdown in Browser');

// 1. Check if dropdown exists
const dropdown = document.querySelector('select.templateDropdown');
console.log('Dropdown element found:', !!dropdown);

if (dropdown) {
  console.log('Dropdown value:', dropdown.value);
  console.log('Dropdown options:', Array.from(dropdown.options).map(opt => ({ value: opt.value, text: opt.text })));
  
  // 2. Test if onChange event is attached
  console.log('onChange handler attached:', typeof dropdown.onchange);
  
  // 3. Test manual change
  console.log('Testing manual change...');
  const originalValue = dropdown.value;
  
  // Find a different option to select
  const options = Array.from(dropdown.options).filter(opt => opt.value !== '' && opt.value !== originalValue);
  if (options.length > 0) {
    const testOption = options[0];
    console.log('Selecting option:', testOption.value, testOption.text);
    
    // Simulate user selection
    dropdown.value = testOption.value;
    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
    
    setTimeout(() => {
      console.log('New dropdown value after change:', dropdown.value);
    }, 100);
  } else {
    console.log('No other options available to test');
  }
} else {
  console.log('❌ Dropdown not found! Check CSS selector or page loading');
}

// 4. Check for React state
console.log('Checking React state...');
const reactFiber = dropdown?._reactInternalFiber || dropdown?.__reactInternalInstance;
if (reactFiber) {
  console.log('React fiber found, component is React-managed');
} else {
  console.log('No React fiber found');
}

// 5. Check for JavaScript errors
console.log('Check console for any JavaScript errors that might prevent dropdown from working');