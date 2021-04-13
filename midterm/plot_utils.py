
import matplotlib.pyplot as plt
import pygal

from pygal_maps_world.maps import World


def plot_line_chart(plot_name, timestamps, value_names, values, save_path):
    line_chart = pygal.Line(x_label_rotation=45, show_minor_x_labels=False)
    line_chart.title = plot_name
    line_chart.x_labels = timestamps
    line_chart.x_labels_major = timestamps[::20]
    for value_name in value_names:
        line_chart.add(value_name, values[value_name])

    line_chart.value_formatter = lambda x: "%.2f" % x

    line_chart.render_to_file(f"{save_path}/{plot_name}.svg")
    line_chart.render_to_png(f"{save_path}/{plot_name}.png")


def plot_bar_chart(plot_name, peer_names, value_name, values, save_path):
    bar_chart = pygal.Bar(x_label_rotation=90)
    bar_chart.title = plot_name
    bar_chart.x_labels = peer_names

    bar_chart.add(value_name, values)
    bar_chart.render_to_file(f"{save_path}/{plot_name}.svg")
    bar_chart.render_to_png(f"{save_path}/{plot_name}.png")


def plot_pie_chart(plot_name, dict_pairs, save_path):
    pie_chart = pygal.Pie()
    pie_chart.title = plot_name
    for key in dict_pairs:
        pie_chart.add(key, dict_pairs[key])
    pie_chart.render_to_file(f"{save_path}/{plot_name}.svg")
    pie_chart.render_to_png(f"{save_path}/{plot_name}.png")


def plot_map(plot_name, countries, save_path):
    worldmap_chart = World()
    worldmap_chart.title = plot_name
    worldmap_chart.add(plot_name, countries)
    worldmap_chart.render_to_file(f"{save_path}/{plot_name}.svg")
    worldmap_chart.render_to_png(f"{save_path}/{plot_name}.png")


def generate_table(table_name, row_headers, col_headers, values, save_path):
    table = plt.table(
        cellText=values,
        rowLabels=row_headers,
        colLabels=col_headers,
        loc="center",
        cellLoc="center",
    )
    table.scale(1.5, 1.5)

    plt.axis("off")
    plt.grid(False)
    plt.savefig(f"{save_path}/{table_name}.png", bbox_inches="tight")
    plt.clf()