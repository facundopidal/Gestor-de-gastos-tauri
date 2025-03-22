export function formatDate(dateArg: string): string {
  const date = new Date(dateArg);
  if (isNaN(date.getTime())) return ''; // Verifica si la fecha es válida

  const day = date.getDate().toString().padStart(2, '0'); // Día con 2 caracteres
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes con 2 caracteres
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0'); // Horas con 2 caracteres
  const minutes = date.getMinutes().toString().padStart(2, '0'); // Minutos con 2 caracteres

  const dateF = `${day}/${month}/${year} ${hours}:${minutes}`;
  return dateF;
}

export function stringToDate(input: string): Date | null {
  // Expresión regular para el formato DD/MM/YYYY HH:mm
  const dateTimeRegex = /^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/(\d{4}) ([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

  if (!dateTimeRegex.test(input)) {
    return null;
  }

  const [datePart, timePart] = input.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  // Crear un objeto Date con la fecha y hora proporcionadas
  const date = new Date(year, month - 1, day, hours, minutes);

  // Validar que los valores coinciden exactamente con la entrada
  if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date.getHours() === hours &&
      date.getMinutes() === minutes 
    ) return date

  return null
  ;
}

export function dateToSQL(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0'); // Día con 2 caracteres
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes con 2 caracteres
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0'); // Horas con 2 caracteres
  const minutes = date.getMinutes().toString().padStart(2, '0'); // Minutos con 2 caracteres

  return `${year}-${month}-${day} ${hours}:${minutes}`

}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}