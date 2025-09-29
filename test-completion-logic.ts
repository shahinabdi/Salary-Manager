// Test script to verify completion logic
const testData = [
  {
    "category": "salary",
    "year": 2025,
    "month": 3,
    "amount": 2298.83,
    "salaryNet": 2298.83,
    "swilePayment": 162,
    "transportPaid": true,
    "worked": true,
    "notes": "",
    "id": "1759187487336-ddj2f71c1"
  },
  {
    "category": "salary",
    "year": 2025,
    "month": 7,
    "amount": 2703.26,
    "salaryNet": 2703.26,
    "swilePayment": 220,
    "transportPaid": false, // Transport NOT paid but should still be complete
    "worked": true,
    "notes": "",
    "id": "1759187590952-y4b490nzl"
  },
  {
    "category": "salary",
    "year": 2025,
    "month": 9,
    "amount": 2648.11,
    "salaryNet": 2648.11,
    "swilePayment": 0, // No swile but should still be complete
    "transportPaid": false,
    "worked": true,
    "notes": "",
    "id": "1759187627869-io4aa5mw6"
  }
];

// Simulate the updated completion logic
function checkCompletion(salaryEntry) {
  if (!salaryEntry.worked) {
    return { complete: true, reason: "Not worked (marked complete)" };
  }
  
  const hasSalary = salaryEntry.salaryNet > 0;
  const hasSwile = salaryEntry.swilePayment > 0;
  
  // New logic: complete if has salary, swile can be 0
  const isComplete = hasSalary && (hasSwile || salaryEntry.swilePayment === 0);
  
  return {
    complete: isComplete,
    hasSalary,
    hasSwile,
    hasTransport: salaryEntry.transportPaid,
    reason: isComplete ? "Complete" : `Missing: ${!hasSalary ? "Salary " : ""}${!hasSwile && salaryEntry.swilePayment !== 0 ? "Swile " : ""}`.trim()
  };
}

console.log("🧪 Testing completion logic with your data:");
testData.forEach(entry => {
  const result = checkCompletion(entry);
  console.log(`📅 ${entry.year}-${entry.month.toString().padStart(2, '0')}: ${result.complete ? '✅' : '❌'} ${result.reason}`);
  console.log(`   Salary: €${entry.salaryNet} | Swile: €${entry.swilePayment} | Transport: ${entry.transportPaid ? '✅' : '❌'}`);
});

export {};