const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'Asia/Shanghai',
});

export const formatPostDate = (date: Date) => formatter.format(date);

const yearFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'Asia/Shanghai' });
export const postYear = (date: Date) => Number(yearFormatter.format(date));
