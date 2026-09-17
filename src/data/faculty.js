export const FLUID_MECHANICS_FACULTY = [
  {
    id: 'mangaleswari',
    salutation: 'Dr.',
    name: 'Dr. Mangaleswari S',
    email: 'mangaleswari.s@rajalakshmi.edu.in',
    designation: 'Associate Professor / Faculty In-Charge',
    department: 'Department of Chemical Engineering',
    course: 'Fluid Mechanics Lab (CH23331)',
    avatar: 'MS'
  },
  {
    id: 'ambigadevi',
    salutation: 'Ms.',
    name: 'Ms. Ambigadevi J',
    email: 'ambigadevi.j@rajalakshmi.edu.in',
    designation: 'Assistant Professor / Faculty In-Charge',
    department: 'Department of Chemical Engineering',
    course: 'Fluid Mechanics Lab (CH23331)',
    avatar: 'AJ'
  }
];

export const UNIVERSAL_TEACHER_PASSWORD = '789456';

export const ALL_FACULTY_LIST = [
  { name: 'Dr. K. Nagarajan (HOD)', email: 'hod.chem@rajalakshmi.edu.in', designation: 'Head of Department' },
  { name: 'Dr. Mangaleswari S', email: 'mangaleswari.s@rajalakshmi.edu.in', designation: 'Associate Professor / FM In-Charge' },
  { name: 'Ms. Ambigadevi J', email: 'ambigadevi.j@rajalakshmi.edu.in', designation: 'Assistant Professor / FM In-Charge' },
  { name: 'Dr. Sundararaman T R', email: 'sundararaman.tr@rajalakshmi.edu.in', designation: 'Professor' },
  { name: 'Dr. Narasimha Reddy S', email: 'narasimhareddy.s@rajalakshmi.edu.in', designation: 'Associate Professor' },
  { name: 'Dr. Seelam Narasimha Reddy', email: 'seelamnarasimhareddy@rajalakshmi.edu.in', designation: 'Associate Professor' },
  { name: 'Dr. Ramesh Chandra Panda', email: 'rameschandrapanda@rajalakshmi.edu.in', designation: 'Professor' },
  { name: 'Dr. Vijayaraghavan G', email: 'vijayaraghavan.g@rajalakshmi.edu.in', designation: 'Associate Professor' },
  { name: 'Dr. Mary Rosana N T', email: 'maryrosana.nt@rajalakshmi.edu.in', designation: 'Associate Professor' },
  { name: 'Dr. Vincent Joseph K L', email: 'vincentjoseph.kl@rajalakshmi.edu.in', designation: 'Associate Professor' },
  { name: 'Dr. Sivamani S', email: 'sivamani.s@rajalakshmi.edu.in', designation: 'Associate Professor' },
  { name: 'Jeffith Manohar E', email: 'jeffithmanohar.e.2024.chem@rajalakshmi.edu.in', designation: 'Faculty / Lab Admin' },
  { name: 'Praveen R', email: 'praveen.r.2024.chem@rajalakshmi.edu.in', designation: 'Lab In-Charge' },
  { name: 'Shrivarshini N', email: 'shrivarshini.n.2024.chem@rajalakshmi.edu.in', designation: 'Lab In-Charge' },
  { name: 'Samyuktha G', email: 'samyuktha.g.2024.chem@rajalakshmi.edu.in', designation: 'Lab In-Charge' },
  { name: 'Rahealcatherine V', email: 'rahealcatherine.v.2024.chem@rajalakshmi.edu.in', designation: 'Lab In-Charge' },
  { name: 'Administrator (Praveen)', email: 'praveenyt872@gmail.com', designation: 'System Administrator' }
];

export const TEACHER_WHITELIST = ALL_FACULTY_LIST.map(f => f.email);

export const isValidRajalakshmiEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith('@rajalakshmi.edu.in');
};
