import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ChartPlaceholder({ title, icon: Icon, description, subtext }) {
  return (
    <Card className="shadow-none border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-2xl font-bold">{description}</div>
        {subtext && (
            <p className="text-xs text-muted-foreground mt-1">
            {subtext}
            </p>
        )}
      </CardContent>
    </Card>
  )
}