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

export const isValidRajalakshmiEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith('@rajalakshmi.edu.in');
};
