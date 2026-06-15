using Middleware.AppoitnmentFiltrator;
using System.Linq.Expressions;

public class Filtrator
{
    public IQueryable<T> ApplyQuery<T, TProperty>(IQueryable<T> query, Expression<Func<T, TProperty>> selector, FiltredObject filter)
    {
        Expression<Func<T, bool>> lambda = CreateQuery(selector, filter);

        if (lambda == null)
            return query;

        return query.Where(lambda);
    }

    public Expression<Func<T, bool>> CreateQuery<T, TProperty>(Expression<Func<T, TProperty>> selector, FiltredObject filter)
    {
        var parameter = selector.Parameters[0];
        Expression condition = null;
        string operation = filter.Operation?.ToLower() ?? "";

        switch (typeof(TProperty)) 
        {
            case Type t when t == typeof(string):
                {
                    var searchConstant = Expression.Constant(filter.Value, typeof(string));

                    switch (operation)
                    {
                        case FilterableOperations.Contains:
                            var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                            condition = Expression.Call(selector.Body, containsMethod, searchConstant);
                            break;

                        default:
                            break;
                    }
                    break;
                }
            case Type t when t == typeof(int):
                {
                    var converter = System.ComponentModel.TypeDescriptor.GetConverter(typeof(TProperty));
                    var convertedValue = converter.ConvertFromString(filter.Value);
                    var searchConstant = Expression.Constant(convertedValue, typeof(TProperty));

                    switch (operation)
                    {
                        case FilterableOperations.Equals:
                            condition = Expression.Equal(selector.Body, searchConstant);
                            break;

                        default:
                            break;
                    }
                    break;
                }

        }
        if (condition == null)
            return null;

        return Expression.Lambda<Func<T, bool>>(condition, parameter);
    }

    public LambdaExpression AddWhere<TDto>(LambdaExpression baseQuery, Expression<Func<TDto, int>> idSelector, int id)
    {
        var idConstant = Expression.Constant(id, typeof(int));

        if (baseQuery == null)
        {
            var condition = Expression.Equal(idSelector.Body, idConstant);
            return Expression.Lambda<Func<TDto, bool>>(condition, idSelector.Parameters[0]);
        }

        var baseParameter = baseQuery.Parameters[0];

        var visitor = new ParameterReplacer(idSelector.Parameters[0], baseParameter);

        var rewrittenIdSelectorBody = visitor.Visit(idSelector.Body);

        var idCondition = Expression.Equal(rewrittenIdSelectorBody, idConstant);

        var combinedBody = Expression.AndAlso(baseQuery.Body, idCondition);

        return Expression.Lambda<Func<TDto, bool>>(combinedBody, baseParameter);
    }
}